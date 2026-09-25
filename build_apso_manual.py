from pathlib import Path
from datetime import date

from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle,
    KeepTogether, ListFlowable, ListItem, HRFlowable, CondPageBreak
)


ROOT = Path(__file__).resolve().parent
TMP = ROOT / "tmp" / "pdfs"
SCREENS = TMP / "screens"
FIGURES = TMP / "figures"
OUTPUT = ROOT / "output" / "pdf"
PDF_PATH = OUTPUT / "Giao-trinh-huong-dan-su-dung-APSO-Mobile.pdf"

BLUE = colors.HexColor("#1D4ED8")
BLUE_DARK = colors.HexColor("#102A56")
SKY = colors.HexColor("#EAF4FF")
GREEN = colors.HexColor("#0F9F75")
MINT = colors.HexColor("#E8FAF4")
AMBER = colors.HexColor("#F59E0B")
AMBER_BG = colors.HexColor("#FFF7E6")
RED = colors.HexColor("#C93636")
RED_BG = colors.HexColor("#FFF0F0")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#516075")
LINE = colors.HexColor("#D7E1EC")
WHITE = colors.white


def ensure_dirs():
    FIGURES.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)


def build_figures():
    home = PILImage.open(SCREENS / "02-trang-chu.png").convert("RGB")
    login = PILImage.open(SCREENS / "01-dang-nhap.png").convert("RGB")

    # Crop the real login card from the desktop screenshot.
    login.crop((390, 105, 885, 610)).save(FIGURES / "login-card.png", quality=95)

    crops = {
        "home-top.png": (0, 0, 375, 185),
        "quick-filter.png": (0, 155, 375, 1040),
        "quality.png": (0, 1010, 375, 1810),
        "overview-flow.png": (0, 1780, 375, 3035),
        "stats.png": (0, 3010, 375, 3860),
        "work-areas.png": (0, 3790, 375, 4701),
    }
    for name, box in crops.items():
        im = home.crop(box)
        if name == "quality.png":
            # Rebuild the record area with fully legible, anonymous sample cards.
            # The heading and score remain from the real APSO screen.
            header = im.crop((0, 0, 375, 155))
            safe = PILImage.new("RGB", (375, 690), "#eef6ff")
            safe.paste(header, (0, 0))
            draw = ImageDraw.Draw(safe)
            regular = ImageFont.truetype(r"C:\Windows\Fonts\arial.ttf", 12)
            bold = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 13)
            for i in range(4):
                top = 170 + i * 120
                draw.rounded_rectangle((18, top, 357, top + 102), radius=10,
                                       fill="#fff4f4", outline="#f2c6c6", width=1)
                draw.text((32, top + 12), "LỖI NẶNG", font=bold, fill="#c93636")
                draw.text((32, top + 35), "Hồ sơ nhân khẩu thiếu thông tin", font=bold, fill="#172033")
                draw.text((32, top + 59), "Mã hồ sơ và họ tên đã được ẩn", font=regular, fill="#516075")
                draw.text((32, top + 80), "Mở hồ sơ", font=bold, fill="#1d4ed8")
            im = safe
        # Upscale with nearest neighbor so small UI text stays crisp.
        im = im.resize((im.width * 2, im.height * 2), PILImage.Resampling.LANCZOS)
        im.save(FIGURES / name, optimize=True)


pdfmetrics.registerFont(TTFont("Arial", r"C:\Windows\Fonts\arial.ttf"))
pdfmetrics.registerFont(TTFont("Arial-Bold", r"C:\Windows\Fonts\arialbd.ttf"))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="BodyVN", fontName="Arial", fontSize=10.1, leading=14.4,
    textColor=INK, spaceAfter=3
))
styles.add(ParagraphStyle(
    name="SmallVN", fontName="Arial", fontSize=8.2, leading=11,
    textColor=MUTED, spaceAfter=3
))
styles.add(ParagraphStyle(
    name="TitleVN", fontName="Arial-Bold", fontSize=25, leading=30,
    textColor=WHITE, alignment=TA_LEFT
))
styles.add(ParagraphStyle(
    name="SubtitleVN", fontName="Arial", fontSize=11.5, leading=16,
    textColor=colors.HexColor("#DDEBFF")
))
styles.add(ParagraphStyle(
    name="H1VN", fontName="Arial-Bold", fontSize=21, leading=26,
    textColor=BLUE_DARK, spaceAfter=10
))
styles.add(ParagraphStyle(
    name="H2VN", fontName="Arial-Bold", fontSize=14.5, leading=18,
    textColor=BLUE, spaceBefore=8, spaceAfter=6
))
styles.add(ParagraphStyle(
    name="H3VN", fontName="Arial-Bold", fontSize=11.5, leading=15,
    textColor=INK, spaceBefore=7, spaceAfter=4
))
styles.add(ParagraphStyle(
    name="CaptionVN", fontName="Arial", fontSize=8, leading=10.5,
    textColor=MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=8
))
styles.add(ParagraphStyle(
    name="CalloutVN", fontName="Arial", fontSize=9.2, leading=13,
    textColor=INK
))
styles.add(ParagraphStyle(
    name="TOCVN", fontName="Arial", fontSize=10, leading=15,
    textColor=BLUE_DARK
))


def P(text, style="BodyVN"):
    return Paragraph(text, styles[style])


def bullet(items, level=0):
    return ListFlowable(
        [ListItem(P(item), leftIndent=10) for item in items],
        bulletType="bullet", bulletFontName="Arial", bulletFontSize=7,
        leftIndent=16 + level * 10, bulletColor=BLUE, spaceAfter=6
    )


def numbered_steps(items):
    rows = []
    for idx, text in enumerate(items, 1):
        badge = Table([[P(f"<b>{idx}</b>", "BodyVN")]], colWidths=[0.62*cm], rowHeights=[0.62*cm])
        badge.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BLUE),
            ("TEXTCOLOR", (0, 0), (-1, -1), WHITE),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("BOX", (0, 0), (-1, -1), 0.5, BLUE),
        ]))
        rows.append([badge, P(text)])
    t = Table(rows, colWidths=[0.85*cm, 16.1*cm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def callout(title, text, kind="info", width_cm=17):
    palette = {
        "info": (SKY, BLUE), "ok": (MINT, GREEN),
        "warn": (AMBER_BG, AMBER), "danger": (RED_BG, RED),
    }
    bg, accent = palette[kind]
    t = Table([[P(f"<b>{title}</b><br/>{text}", "CalloutVN")]], colWidths=[width_cm*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.8, accent),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def figure(path, width_cm, caption):
    im = PILImage.open(path)
    ratio = im.height / im.width
    width = width_cm * cm
    height = width * ratio
    max_height = 18.5 * cm
    if height > max_height:
        scale = max_height / height
        height = max_height
        width *= scale
    img = Image(str(path), width=width, height=height)
    return KeepTogether([img, P(caption, "CaptionVN")])


def image_block(path, width_cm, caption, max_height_cm=16.5):
    im = PILImage.open(path)
    width = width_cm * cm
    height = width * (im.height / im.width)
    max_height = max_height_cm * cm
    if height > max_height:
        scale = max_height / height
        width *= scale
        height = max_height
    return [Image(str(path), width=width, height=height), P(caption, "CaptionVN")]


def section(title, subtitle=None):
    parts = [CondPageBreak(8*cm), P(title, "H1VN")]
    if subtitle:
        parts += [P(subtitle), HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=8)]
    return parts


def hard_section(title, subtitle=None):
    parts = [PageBreak(), P(title, "H1VN")]
    if subtitle:
        parts += [P(subtitle), HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=8)]
    return parts


def data_table(headers, rows, widths, font=8.5):
    data = [[P(f"<b>{h}</b>", "SmallVN") for h in headers]]
    for row in rows:
        data.append([Paragraph(str(v), ParagraphStyle(
            name=f"tbl{font}", fontName="Arial", fontSize=font,
            leading=font+3, textColor=INK
        )) for v in row])
    t = Table(data, colWidths=[w*cm for w in widths], repeatRows=1, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, colors.HexColor("#F7FAFD")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def footer(canvas, doc):
    if doc.page == 1:
        return
    canvas.saveState()
    page_w, page_h = A4
    canvas.setFillColor(BLUE_DARK)
    canvas.rect(0, page_h - 0.22*cm, page_w, 0.22*cm, fill=1, stroke=0)
    canvas.setFont("Arial-Bold", 7.5)
    canvas.setFillColor(BLUE_DARK)
    canvas.drawString(2*cm, page_h - 0.82*cm, "APSO  |  GIÁO TRÌNH HƯỚNG DẪN SỬ DỤNG")
    canvas.setStrokeColor(LINE)
    canvas.line(2*cm, 1.35*cm, 19*cm, 1.35*cm)
    canvas.setFont("Arial", 8)
    canvas.setFillColor(MUTED)
    canvas.drawString(2*cm, 0.85*cm, "Giáo trình sử dụng APSO Mobile - Bản nội bộ")
    canvas.drawRightString(19*cm, 0.85*cm, f"Trang {doc.page}")
    canvas.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        str(PDF_PATH), pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.7*cm,
        title="Giáo trình hướng dẫn sử dụng APSO Mobile",
        author="APSO",
        subject="Hướng dẫn chi tiết các chức năng APSO Mobile",
    )
    story = []

    # Cover
    cover = Table([
        [Image(str(ROOT / "icons" / "apso-192.png"), 2.2*cm, 2.2*cm)],
        [Spacer(1, 0.5*cm)],
        [P("GIÁO TRÌNH HƯỚNG DẪN<br/>SỬ DỤNG APSO MOBILE", "TitleVN")],
        [Spacer(1, 0.25*cm)],
        [P("Hộ khẩu - Nhân khẩu - Tọa độ và hình ảnh - Phân tích - Phân quyền", "SubtitleVN")],
        [Spacer(1, 8.0*cm)],
        [P("Bản hướng dẫn nội bộ - cập nhật 18/09/2026", "SubtitleVN")],
    ], colWidths=[17*cm], rowHeights=[None]*7)
    cover.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BLUE_DARK),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story += [cover, PageBreak()]

    # User-provided introduction, placed before Part 1.
    story += [
        P("GIỚI THIỆU PHẦN MỀM APSO", "H1VN"),
        P("I. TỔNG QUAN HỆ THỐNG", "H2VN"),
        P("<b>APSO - Hệ thống chuyển đổi số ấp</b> là phần mềm được xây dựng nhằm hỗ trợ số hóa công tác quản lý địa bàn, dân cư và hoạt động tại ấp. Hệ thống giúp tập trung dữ liệu, giảm việc ghi chép thủ công, rút ngắn thời gian tra cứu và nâng cao hiệu quả tổng hợp, báo cáo."),
        P("APSO được thiết kế theo hướng trực quan, dễ sử dụng và phù hợp với công việc thực tế tại cơ sở. Dữ liệu được tổ chức khoa học, hỗ trợ cán bộ phụ trách nắm bắt tình hình dân cư, quản lý công việc và khai thác thông tin theo từng nhóm đối tượng."),
        P("II. CÁC CHỨC NĂNG CHÍNH", "H2VN"),
        P("1. Quản lý tài khoản và phân quyền", "H3VN"),
        P("Hệ thống cho phép tạo tài khoản, phân công vai trò và giới hạn quyền truy cập theo từng người sử dụng. Mỗi tài khoản chỉ được xem, thêm, sửa hoặc khai thác những nội dung phù hợp với nhiệm vụ được giao, góp phần bảo đảm an toàn và bảo mật dữ liệu."),
        P("2. Quản lý công việc", "H3VN"),
        P("Hỗ trợ tạo nhiệm vụ, phân công người thực hiện, theo dõi tiến độ và cập nhật kết quả xử lý. Công việc có thể được sắp xếp theo thời gian, trạng thái, mức độ ưu tiên hoặc lĩnh vực phụ trách, giúp hạn chế bỏ sót nhiệm vụ."),
        P("3. Quản lý dữ liệu dân cư trên địa bàn ấp", "H3VN"),
        P("Hệ thống hỗ trợ lưu trữ và quản lý các nhóm thông tin như:"),
        bullet([
            "Thông tin cá nhân và thông tin liên hệ;",
            "Số định danh cá nhân;",
            "Thông tin hộ gia đình, nhân khẩu và cư trú;",
            "Thông tin bảo hiểm;",
            "Quan hệ giữa các thành viên trong hộ;",
            "Tình trạng cư trú và biến động dân cư;",
            "Các thông tin cần thiết khác phục vụ công tác quản lý tại địa phương.",
        ]),
        P("4. Phân loại và thống kê dân cư", "H3VN"),
        P("APSO cho phép tìm kiếm, lọc và thống kê người dân theo nhiều tiêu chí như độ tuổi, giới tính, khu vực cư trú, tình trạng bảo hiểm và nhóm đối tượng. Hệ thống hỗ trợ lập danh sách trẻ em, người cao tuổi, người khuyết tật, hộ có hoàn cảnh khó khăn, đối tượng chính sách và các nhóm cần được quan tâm, hỗ trợ."),
        P("5. Quản lý vị trí hộ dân trên bản đồ", "H3VN"),
        P("Mỗi hộ gia đình có thể được xác định vị trí bằng tọa độ địa lý và hiển thị trực quan trên bản đồ số. Chức năng này hỗ trợ xác định địa bàn, tra cứu đường đi, phân chia khu vực quản lý và phục vụ công tác tiếp cận hộ dân khi cần thiết."),
        P("6. Tổng hợp, tra cứu và báo cáo", "H3VN"),
        P("Dữ liệu được sắp xếp tập trung, giúp tìm kiếm nhanh, thống kê chính xác và lập các danh sách phục vụ công việc. Người sử dụng có thể khai thác thông tin theo từng khu vực, hộ gia đình, nhóm tuổi, nhóm đối tượng hoặc tiêu chí quản lý cụ thể."),
        P("III. ĐỊNH HƯỚNG PHÁT TRIỂN VÀ QUY ĐỊNH SỬ DỤNG", "H2VN"),
        P("APSO hiện đang trong quá trình nghiên cứu, xây dựng và hoàn thiện. Các chức năng của hệ thống sẽ tiếp tục được cập nhật, cải tiến dựa trên nhu cầu thực tế, hướng đến mục tiêu hỗ trợ công tác quản lý tại ấp ngày càng khoa học, thuận tiện và hiệu quả."),
        P("Việc thu thập, cập nhật và khai thác dữ liệu cá nhân trên hệ thống phải được thực hiện đúng thẩm quyền, đúng mục đích và tuân thủ các quy định về bảo vệ dữ liệu cá nhân."),
        Spacer(1, 10),
        callout("APSO", "<b><i>Số hóa quản lý, kết nối cộng đồng, phục vụ nhân dân.</i></b>", "ok"),
    ]

    # Part 1 and contents
    story += section("1. Phạm vi và cách dùng giáo trình")
    story += [P("Tài liệu này dành cho cán bộ sử dụng APSO trên điện thoại Android hoặc trình duyệt. Nội dung được biên soạn từ giao diện APSO bản nội bộ hiện có và đối chiếu trực tiếp với các chức năng trong ứng dụng."),
              callout("Bảo vệ dữ liệu", "Ảnh minh họa trong giáo trình đã che thông tin hồ sơ cụ thể. Khi dùng thật, không chụp màn hình CCCD, số định danh, địa chỉ hoặc ảnh nhà để gửi qua nhóm chat công cộng.", "warn"),
              Spacer(1, 8),
              P("<b>Nguyên tắc thao tác</b>", "H2VN"),
              bullet([
                  "Tìm đúng hộ khẩu trước khi thêm nhân khẩu để tránh tạo hồ sơ rời hoặc trùng.",
                  "Sau mỗi lần lưu, kiểm tra thông báo thành công và mở lại hồ sơ để đối chiếu.",
                  "Chỉ cấp đúng quyền cần dùng; chức danh không tự động đồng nghĩa với toàn quyền.",
                  "Không khôi phục dữ liệu hoặc xóa hồ sơ khi chưa có bản sao lưu và người có thẩm quyền xác nhận.",
              ]),
              P("<b>Các chương chính</b>", "H2VN"),
              data_table(["Chương", "Nội dung"], [
                  ["2-4", "Cài đặt, đăng nhập và làm quen trang chủ"],
                  ["5-7", "Tìm kiếm, quản lý nhân khẩu và quét CCCD/QR"],
                  ["8-10", "Quản lý hộ khẩu, tọa độ và hình ảnh"],
                  ["11-13", "Thông báo, phân tích và kiểm tra chất lượng dữ liệu"],
                  ["14", "Quản trị tài khoản, chức danh và phân quyền"],
                  ["15-17", "Sao lưu, quy trình công việc và xử lý lỗi"],
              ], [2.4, 14.6])]

    # Install
    story += section("2. Cài đặt APSO trên điện thoại", "Dùng mã QR để tải file APK hiện tại.")
    qr = ROOT / "android-app" / "release" / "APSO-QR-Tai-Ung-Dung.png"
    story += [figure(qr, 7.2, "Hình 2.1 - Mã QR tải trực tiếp file APSO-Android-v1.apk."),
              numbered_steps([
                  "Mở Camera hoặc ứng dụng quét QR trên điện thoại.",
                  "Quét mã QR và chọn đường dẫn tải xuống. Điện thoại sẽ tải file APSO-Android-v1.apk.",
                  "Mở file đã tải. Nếu Android hỏi cho phép cài ứng dụng từ nguồn này, chỉ cho phép đối với trình duyệt đang dùng.",
                  "Chọn Cài đặt, sau đó mở APSO từ biểu tượng trên màn hình.",
              ]),
              callout("Sự thật cần biết", "QR không thể âm thầm cài ứng dụng. Android luôn yêu cầu người dùng xác nhận tải và cài APK để bảo vệ thiết bị.", "info"),
              callout("Khi có phiên bản mới", "Ứng dụng mở hệ thống web APSO nên phần lớn tính năng và dữ liệu được cập nhật mà không cần cài lại APK. Tuy nhiên vẫn cần nâng cấp APK khi Google thay đổi yêu cầu nền tảng hoặc chính sách.", "ok")]

    # Login
    story += section("3. Đăng nhập và ghi nhớ tài khoản")
    story += [figure(FIGURES / "login-card.png", 10.3, "Hình 3.1 - Màn hình đăng nhập APSO."),
              numbered_steps([
                  "Nhập đúng địa chỉ email đã được quản trị viên tạo tài khoản.",
                  "Nhập mật khẩu. Kiểm tra viết hoa, bàn phím tiếng Việt và khoảng trắng nếu đăng nhập thất bại.",
                  "Chọn Ghi nhớ tài khoản trên thiết bị này nếu đây là điện thoại làm việc cá nhân.",
                  "Bấm Đăng nhập và chờ trang Tổng quan xuất hiện.",
              ]),
              callout("Ghi nhớ tài khoản không lưu mật khẩu", "Ứng dụng chỉ lưu địa chỉ email trên thiết bị. Người dùng vẫn phải nhập mật khẩu ở lần đăng nhập tiếp theo.", "info"),
              callout("Không dùng trên máy chung", "Không chọn ghi nhớ tài khoản trên máy mượn, máy trực chung hoặc thiết bị có nhiều người sử dụng.", "warn")]

    # Home
    story += section("4. Trang chủ và thanh chức năng")
    story += [figure(FIGURES / "home-top.png", 9.6, "Hình 4.1 - Thanh trạng thái và các nhóm chức năng chính trên APSO Mobile."),
              data_table(["Mục", "Dùng để làm gì"], [
                  ["Tổng quan", "Tìm nhanh, xem số liệu chính và mở quy trình thao tác nhanh."],
                  ["Nhân khẩu", "Tìm kiếm, lọc, xem, thêm và chỉnh sửa hồ sơ cá nhân."],
                  ["Hộ khẩu", "Quản lý hộ, thành viên, ảnh nhà và tọa độ."],
                  ["Thông báo", "Theo dõi việc cần xử lý, phân công, cập nhật và duyệt kết quả."],
                  ["Phân tích", "Xem chỉ số dân cư, nhóm tuổi, đoàn thể và chất lượng hộ khẩu."],
                  ["Quản trị", "Tạo tài khoản, chỉnh chức danh, vai trò, quyền, nhiệm vụ và thời hạn."],
                  ["Backup / Khôi phục", "Xuất bản sao dữ liệu và khôi phục từ file JSON."],
              ], [3.5, 13.5]),
              callout("Menu phụ thuộc quyền", "Nếu một mục bị ẩn hoặc nút không bấm được, nguyên nhân thường là tài khoản chưa được cấp quyền tương ứng hoặc quyền đã hết hiệu lực.", "info")]

    # Quick filter
    story += hard_section("5. Tìm nhanh và lọc dữ liệu", "Có thể kết hợp nhiều điều kiện; không cần xóa bộ lọc ngày sinh khi dùng bộ lọc tuổi.")
    story += [figure(FIGURES / "quick-filter.png", 8.8, "Hình 5.1 - Khối Tìm nhanh nhân khẩu trên điện thoại."),
              numbered_steps([
                  "Chọn Nhân khẩu hoặc Hộ khẩu tùy loại dữ liệu cần tìm.",
                  "Nhập tên, số CCCD hoặc mã hộ vào ô tìm kiếm. Chỉ nhập vài ký tự nếu chưa nhớ chính xác.",
                  "Chọn trạng thái cư trú, ấp và tổ nếu cần thu hẹp khu vực.",
                  "Lọc theo khoảng ngày sinh bằng Từ ngày sinh và Đến ngày sinh, hoặc lọc theo số tuổi bằng Từ tuổi và Đến tuổi.",
                  "Có thể chọn thêm dân tộc, đoàn thể và tình trạng nghĩa vụ quân sự.",
                  "Bấm Xem nhân khẩu đã lọc để mở đúng danh sách kết quả.",
              ]),
              callout("Quy tắc khoảng tuổi", "Nếu chỉ muốn một tuổi, nhập cùng một số ở Từ tuổi và Đến tuổi. Nếu nhập cả ngày sinh lẫn tuổi, hồ sơ phải thỏa cả hai điều kiện.", "info"),
              callout("Khi không thấy kết quả", "Xóa từng điều kiện từ dưới lên, đặc biệt là tổ, khoảng ngày sinh và khoảng tuổi. Không kết luận dữ liệu bị mất trước khi đặt lại bộ lọc.", "warn")]

    # Resident
    story += section("6. Quản lý nhân khẩu", "Luồng chuẩn: tìm hộ > thêm nhân khẩu > kiểm tra > lưu.")
    story += [P("<b>6.1 Thêm nhân khẩu</b>", "H2VN"),
              numbered_steps([
                  "Từ Tổng quan chọn Thêm nhân khẩu hoặc mở mục Nhân khẩu rồi chọn thêm mới.",
                  "Tìm và chọn đúng hộ khẩu. Nếu hộ chưa tồn tại, dừng lại và lập hộ trước.",
                  "Nhập họ tên, ngày sinh, giới tính, số định danh/CCCD, số điện thoại và quan hệ với chủ hộ.",
                  "Kiểm tra địa chỉ thường trú, ấp, tổ và trạng thái Thường trú/Tạm trú/Chưa đăng ký.",
                  "Cập nhật nghề nghiệp, dân tộc, tôn giáo, BHYT, BHXH, diện chính sách, đoàn thể, NVQS và ghi chú khi có dữ liệu.",
                  "Bấm Lưu cư dân. Mở lại hồ sơ vừa tạo và đối chiếu ít nhất họ tên, ngày sinh, CCCD, hộ và quan hệ.",
              ]),
              P("<b>6.2 Chỉnh sửa nhân khẩu</b>", "H2VN"),
              bullet([
                  "Tìm người bằng tên hoặc CCCD, mở hồ sơ rồi chọn Chỉnh sửa nhân khẩu.",
                  "Chỉ sửa nội dung có căn cứ. Ghi chú lý do khi thay đổi thông tin quan trọng.",
                  "Số định danh phải đủ 12 chữ số. Ngày sinh nhập theo định dạng ngày/tháng/năm trên giao diện.",
                  "Nếu chuyển hộ, chọn đúng hộ đích và kiểm tra lại quan hệ với chủ hộ.",
              ]),
              callout("Tránh hồ sơ trùng", "Trước khi tạo mới phải tìm theo CCCD và họ tên. Nếu đã có hồ sơ, dùng Chỉnh sửa thay vì thêm lần nữa.", "danger"),
              callout("Dữ liệu nhạy cảm", "Quyền Xem nhân khẩu chưa chắc cho phép xem trường nhạy cảm. Chỉ tài khoản có quyền Xem thông tin nhạy cảm mới nên truy cập CCCD và dữ liệu tương đương.", "warn")]

    # QR scan
    story += section("7. Quét CCCD / QR và nhập nhanh")
    story += [numbered_steps([
                  "Tại khối Tìm nhanh, bấm Quét CCCD / QR.",
                  "Chọn chế độ phù hợp. Với QR, đưa mã vào giữa khung; ứng dụng sẽ tự nhận diện khi hình đủ rõ.",
                  "Với căn cước, đặt thẻ trên nền phẳng, đủ sáng, không lóa và giữ toàn bộ thẻ trong khung.",
                  "Kiểm tra dữ liệu nhận được. Không lưu ngay nếu họ tên, ngày sinh hoặc số định danh bị nhận sai.",
                  "Chọn ghép vào hồ sơ hiện có hoặc dùng dữ liệu để lập hồ sơ mới theo đúng tình huống.",
              ]),
              callout("Quyền Camera", "Lần đầu sử dụng, Android hoặc trình duyệt có thể hỏi quyền Camera. Chỉ cho phép khi đang thao tác quét. Nếu bị chặn, vào quyền ứng dụng APSO để bật lại.", "info"),
              callout("Khi camera không mở", "Đóng ứng dụng camera khác, kiểm tra quyền Camera, thử Chụp nhanh hoặc Tải ảnh. Nếu vẫn lỗi, nhập thủ công và đối chiếu trực tiếp với giấy tờ.", "warn"),
              data_table(["Dấu hiệu ảnh tốt", "Dấu hiệu cần chụp lại"], [
                  ["Đủ bốn góc, chữ rõ, không rung", "Mất góc, nhòe hoặc quá xa"],
                  ["Ánh sáng đều, không phản quang", "Có vệt sáng che số hoặc ngày sinh"],
                  ["Mã QR nằm giữa khung", "QR bị gấp, nghiêng mạnh hoặc quá nhỏ"],
              ], [8.5, 8.5])]

    # Household
    story += section("8. Quản lý hộ khẩu", "Hộ khẩu là hồ sơ gốc để liên kết các thành viên, địa chỉ, ảnh nhà và tọa độ.")
    story += [P("<b>8.1 Lập hộ khẩu mới</b>", "H2VN"),
              numbered_steps([
                  "Từ Tổng quan bấm Lập hộ khẩu mới.",
                  "Kiểm tra mã hộ khẩu do hệ thống tạo. Không tự sửa mã chỉ để giống sổ giấy.",
                  "Nhập chủ hộ, CCCD, điện thoại và ngày sinh chủ hộ.",
                  "Chọn loại hộ, tỉnh, xã, ấp, tổ và nhập địa chỉ chi tiết.",
                  "Thêm tọa độ và ảnh hộ nếu đang có mặt tại địa chỉ.",
                  "Bấm Lưu hộ khẩu. Hệ thống đồng thời tạo thành viên đầu tiên với quan hệ Chủ hộ.",
              ]),
              P("<b>8.2 Xem và chỉnh sửa hộ</b>", "H2VN"),
              bullet([
                  "Mở mục Hộ khẩu, tìm bằng mã hộ, tên chủ hộ hoặc địa chỉ.",
                  "Trong chi tiết hộ, kiểm tra danh sách thành viên, loại hộ, địa chỉ, ảnh và tọa độ.",
                  "Khi đổi địa chỉ hộ, dữ liệu địa bàn của các thành viên liên quan cũng cần được đối chiếu.",
                  "Hệ thống yêu cầu có Chủ hộ và Địa chỉ chi tiết trước khi lưu chỉnh sửa.",
              ]),
              callout("Không xóa hộ khi còn thành viên", "Trước khi xóa hoặc tách hộ phải xử lý quan hệ thành viên. Xóa hộ không phải là cách sửa mã hoặc sửa tên chủ hộ.", "danger")]

    # Coordinates/photos
    story += section("9. Tọa độ và hình ảnh hộ khẩu")
    story += [P("<b>9.1 Ghi tọa độ</b>", "H2VN"),
              numbered_steps([
                  "Mở hộ khẩu cần cập nhật và chọn chỉnh sửa.",
                  "Tại phần Bản đồ, tọa độ và hình ảnh, có thể nhập Vĩ độ/Kinh độ, chọn điểm trên bản đồ hoặc bấm Check-in bằng vị trí hiện tại.",
                  "Khi dùng Check-in, đứng gần đúng căn nhà, bật Vị trí/GPS và cho phép APSO truy cập vị trí.",
                  "Đối chiếu điểm trên bản đồ. Không lưu nếu điểm nhảy sang đường khác, khu vực khác hoặc sai ấp.",
                  "Bấm Lưu hộ khẩu và mở lại để kiểm tra.",
              ]),
              P("<b>9.2 Đăng ảnh hộ</b>", "H2VN"),
              numbered_steps([
                  "Chọn chụp bằng camera hoặc tải ảnh có sẵn từ điện thoại.",
                  "Chụp mặt trước hoặc đặc điểm nhận diện căn nhà, tránh chụp người không liên quan.",
                  "Kiểm tra ảnh không mờ, không ngược và không chứa giấy tờ cá nhân.",
                  "Ứng dụng tối ưu dung lượng ảnh; chờ ảnh xem trước xuất hiện rồi mới lưu hộ.",
              ]),
              data_table(["Chỉ số phân tích", "Ý nghĩa"], [
                  ["Thiếu tọa độ", "Hộ chưa có đủ vĩ độ và kinh độ."],
                  ["Hộ đã có tọa độ", "Hộ có điểm vị trí để mở và kiểm tra trên bản đồ."],
                  ["Chưa có ảnh hộ", "Hộ chưa có ảnh nhà/hộ được lưu."],
                  ["Hộ đã đăng ảnh", "Hộ đã có ảnh và có thể mở đúng danh sách từ Phân tích."],
              ], [5.2, 11.8]),
              callout("Tọa độ hợp lệ chưa chắc đúng nhà", "Hệ thống có thể phát hiện số ngoài phạm vi nhưng không tự biết điểm có đúng căn nhà hay không. Người cập nhật phải kiểm tra thực địa và bản đồ.", "warn")]

    # Quick process image
    story += hard_section("10. Quy trình thao tác nhanh trên trang Tổng quan")
    story += [figure(FIGURES / "overview-flow.png", 8.7, "Hình 10.1 - Khối quy trình nhanh và số liệu Tổng quan."),
              data_table(["Nút", "Khi nào dùng", "Kết quả"], [
                  ["Lập hộ khẩu mới", "Chưa có hộ trên hệ thống", "Tạo hộ và chủ hộ đầu tiên"],
                  ["Thêm nhân khẩu", "Hộ đã tồn tại", "Tạo thành viên gắn với hộ"],
                  ["Tạo nhắc việc", "Có việc cần theo dõi", "Tạo nhiệm vụ có người phụ trách và hạn"],
                  ["Xuất danh sách", "Cần tổng hợp theo bộ lọc", "Tải CSV hoặc XLSX"],
              ], [4.2, 6.3, 6.5]),
              callout("Thứ tự chuẩn", "Lập hộ trước > thêm nhân khẩu > bổ sung ảnh/tọa độ > tạo việc rà soát nếu còn thiếu > xuất báo cáo khi dữ liệu đã được kiểm tra.", "ok")]

    # Notifications
    story += section("11. Thông báo và nhiệm vụ")
    story += [P("Thông báo không chỉ là tin nhắn; đây là nơi ghi việc cần xử lý, người được giao, hạn hoàn thành và trạng thái duyệt."),
              numbered_steps([
                  "Mở Thông báo hoặc bấm Tạo nhắc việc từ Tổng quan.",
                  "Nhập tiêu đề rõ hành động, ví dụ: Bổ sung tọa độ hộ HK-xxxx.",
                  "Chọn người được giao, hạn xử lý và mức độ phù hợp.",
                  "Người thực hiện cập nhật trạng thái, kết quả và nội dung còn vướng.",
                  "Người có quyền duyệt kiểm tra kết quả trước khi chuyển Đã duyệt/Đã xử lý.",
              ]),
              data_table(["Trạng thái", "Cách hiểu"], [
                  ["Chưa xử lý", "Việc mới tạo, chưa bắt đầu."],
                  ["Đang xử lý", "Đã nhận việc và đang thực hiện."],
                  ["Đang vướng", "Có trở ngại; phải ghi rõ nguyên nhân."],
                  ["Chờ duyệt", "Người thực hiện đã gửi kết quả."],
                  ["Đã duyệt / Đã xử lý", "Kết quả đã được xác nhận hoặc việc đã hoàn tất."],
              ], [4.2, 12.8]),
              callout("Không dùng tiêu đề mơ hồ", "Tránh ghi chỉ 'kiểm tra lại'. Nên ghi đối tượng, việc phải làm và hạn để người nhận biết chính xác trách nhiệm.", "warn")]

    # Analytics
    story += hard_section("12. Phân tích dân cư và chất lượng hộ khẩu")
    age_table = data_table(["Nhóm", "Điều kiện"], [
        ["Dưới 6 tuổi", "Tuổi < 6"],
        ["Từ 6 đến dưới 14 tuổi", "6-13 tuổi"],
        ["Từ 14 đến dưới 16 tuổi", "14-15 tuổi"],
        ["Từ 16 đến dưới 18 tuổi", "16-17 tuổi"],
        ["Từ 18 đến dưới 60 tuổi", "18-59 tuổi"],
        ["Từ 60 tuổi trở lên", "Tuổi >= 60"],
    ], [6.6, 3.5], font=7.8)
    analytics_grid = Table([[
        image_block(FIGURES / "stats.png", 5.8, "Hình 12.1 - Số liệu nhanh trên Tổng quan.", 14.8),
        [P("<b>12.1 Nhóm tuổi đang sử dụng</b>", "H2VN"), age_table,
         Spacer(1, 5),
         callout("Cách đọc", "Tuổi được tính từ ngày sinh hiện có trong hồ sơ. Hồ sơ thiếu ngày sinh không thể xếp nhóm chính xác.", "info", 10.1)]
    ]], colWidths=[6.3*cm, 10.7*cm], hAlign="LEFT")
    analytics_grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story += [analytics_grid,
              P("<b>12.2 Cách mở danh sách từ chỉ số</b>", "H2VN"),
              bullet([
                  "Bấm vào chỉ số tuổi, giới tính hoặc tình trạng thiếu dữ liệu để hệ thống mở đúng danh sách và tự áp bộ lọc.",
                  "Trong Chất lượng hộ khẩu, có thể mở riêng Tổng hộ, Hộ chính sách/khác, Thiếu tọa độ, Hộ đã có tọa độ, Chưa có ảnh hộ và Hộ đã đăng ảnh.",
                  "Số liệu là kết quả từ dữ liệu hiện có; hồ sơ thiếu ngày sinh sẽ không được xếp chính xác vào nhóm tuổi.",
              ]),
              callout("Không nhầm số liệu với thực tế tuyệt đối", "Biểu đồ chỉ đúng bằng dữ liệu đã nhập. Trước khi báo cáo, phải xử lý các hồ sơ thiếu ngày sinh, trùng số định danh, thiếu tọa độ hoặc sai địa bàn.", "danger")]

    # Data quality
    story += hard_section("13. Điểm dữ liệu và rà soát lỗi")
    issue_table = data_table(["Nhóm", "Ví dụ", "Cách xử lý"], [
        ["Thiếu", "Thiếu tên, ngày sinh, CCCD hoặc hộ", "Đối chiếu giấy tờ rồi bổ sung"],
        ["Trùng", "Trùng CCCD hoặc mã hộ", "Xác định hồ sơ đúng và hợp nhất"],
        ["Tọa độ", "Chưa có hoặc ngoài phạm vi", "Check-in/chọn lại trên bản đồ"],
        ["Ảnh", "Chưa có ảnh người hoặc ảnh hộ", "Bổ sung khi có căn cứ"],
        ["Nhiệm vụ", "Quá hạn chưa hoàn thành", "Cập nhật hoặc phân công lại"],
    ], [2.0, 4.1, 4.1], font=7.4)
    quality_grid = Table([[
        image_block(FIGURES / "quality.png", 5.8, "Hình 13.1 - Dữ liệu hồ sơ đã được ẩn.", 15.2),
        [P("Điểm dữ liệu được tính từ lỗi nặng và cảnh báo. Điểm thấp không có nghĩa dữ liệu bị xóa; nó cho biết còn hồ sơ cần rà soát."),
         Spacer(1, 4), issue_table,
         Spacer(1, 5),
         callout("Nguyên tắc", "Sửa đúng theo nguồn xác minh; không sửa đại chỉ để tăng điểm.", "warn", 10.1)]
    ]], colWidths=[6.3*cm, 10.7*cm], hAlign="LEFT")
    quality_grid.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    story += [quality_grid,
              numbered_steps([
                  "Bấm Mở hồ sơ tại từng lỗi.",
                  "Đọc tên lỗi trước khi sửa; không sửa đại để tăng điểm.",
                  "Đối chiếu nguồn tin cậy, chỉnh đúng trường và lưu.",
                  "Quay lại Điểm dữ liệu để xác nhận lỗi đã biến mất.",
              ])]

    # Work areas
    story += hard_section("14. Quản trị tài khoản, chức danh và phân quyền")
    story += [figure(FIGURES / "work-areas.png", 8.5, "Hình 14.1 - Các khu vực công việc trên giao diện Mobile."),
              callout("Ba khái niệm khác nhau", "Chức danh là tên hiển thị; Vai trò là nhóm quyền gợi ý; Quyền là thao tác thực tế được phép. Một người có thể có 0, 1 hoặc nhiều quyền tùy nhiệm vụ và thời kỳ.", "info"),
              P("<b>14.1 Chức danh có thể chỉnh sửa</b>", "H2VN"),
              bullet([
                  "Cán bộ địa bàn", "Trưởng ấp", "Phó ấp", "Bí thư Chi bộ", "Phó Bí thư Chi bộ",
                  "Có thể nhập chức danh khác phù hợp thực tế nếu được quản trị viên cho phép.",
              ]),
              P("<b>14.2 Vai trò hệ thống</b>", "H2VN"),
              data_table(["Vai trò", "Mục đích"], [
                  ["Quản trị hệ thống", "Quản lý toàn bộ hệ thống; chỉ cấp cho rất ít người."],
                  ["Trưởng ấp/thôn", "Quản lý dân cư, hộ, báo cáo và nhiệm vụ trong phạm vi được giao."],
                  ["Lãnh đạo", "Theo dõi, duyệt, giao việc và xem báo cáo."],
                  ["Công an/Bảo vệ", "Xử lý nghiệp vụ cư dân, hộ và dữ liệu liên quan theo nhiệm vụ."],
                  ["Cán bộ phụ trách", "Nhập, sửa và theo dõi dữ liệu theo địa bàn/công việc."],
                  ["Người xem báo cáo", "Chủ yếu xem số liệu, không chỉnh sửa dữ liệu."],
              ], [5.2, 11.8])]

    permissions = [
        ("Nhân khẩu", "Xem; Thêm; Sửa; Xóa nhân khẩu"),
        ("Hộ khẩu", "Xem; Thêm; Sửa; Xóa hộ khẩu"),
        ("Báo cáo", "Xem; Gửi; Duyệt báo cáo"),
        ("Nhiệm vụ", "Xem; Phân công; Cập nhật việc được giao; Duyệt hoàn thành; Xóa nhiệm vụ"),
        ("Quản trị", "Phân quyền cấp dưới; Quản lý địa bàn; Quản lý tài khoản"),
        ("Dữ liệu", "Xuất dữ liệu; Xem thông tin nhạy cảm; Xem ảnh/tọa độ"),
    ]
    story += [P("<b>14.3 Danh sách quyền độc lập</b>", "H2VN"),
              data_table(["Nhóm", "Các quyền có thể cấp riêng"], permissions, [4.2, 12.8]),
              P("<b>14.4 Cấp hoặc điều chỉnh quyền</b>", "H2VN"),
              numbered_steps([
                  "Mở Quản trị và chọn đúng tài khoản.",
                  "Chỉnh chức danh nếu cần; không dùng chức danh để thay cho quyền.",
                  "Chọn vai trò phù hợp làm nền, sau đó tích hoặc bỏ từng quyền theo nhiệm vụ thực tế.",
                  "Nhập Nhiệm vụ được giao bằng câu cụ thể, nêu địa bàn hoặc phạm vi công việc.",
                  "Chọn Hiệu lực từ và Đến ngày. Quyền ngoài khoảng hiệu lực sẽ không được áp dụng.",
                  "Đăng nhập thử bằng tài khoản đó để kiểm tra menu và thao tác đúng phạm vi.",
              ]),
              callout("Nguyên tắc quyền tối thiểu", "Không cấp Xóa, Quản lý tài khoản, Phân quyền cấp dưới, Xem thông tin nhạy cảm hoặc toàn quyền nếu nhiệm vụ không yêu cầu. Quyền nhiều hơn không làm công việc nhanh hơn nhưng làm rủi ro lớn hơn.", "danger"),
              callout("Rà soát định kỳ", "Khi cán bộ đổi nhiệm vụ hoặc hết thời hạn, cập nhật quyền và ngày hiệu lực ngay. Không để tài khoản cũ tiếp tục có quyền chỉ vì vẫn còn chức danh.", "warn")]

    # Backup
    story += section("15. Backup, khôi phục và xuất dữ liệu")
    story += [P("<b>15.1 Backup</b>", "H2VN"),
              numbered_steps([
                  "Chỉ người có thẩm quyền bấm Backup.",
                  "Ứng dụng tải file JSON có tên dạng apso-backup-YYYY-MM-DD.json.",
                  "Lưu file vào nơi được bảo vệ; không gửi qua nhóm chat hoặc lưu công khai.",
                  "Ghi nhận ngày, người tạo và lý do sao lưu.",
              ]),
              P("<b>15.2 Khôi phục</b>", "H2VN"),
              numbered_steps([
                  "Xác định đúng file backup và kiểm tra ngày tạo.",
                  "Bấm Khôi phục, chọn file JSON và đọc kỹ số lượng hộ, nhân khẩu, nhiệm vụ trong bản xem trước.",
                  "Chỉ xác nhận khi đã được người phụ trách dữ liệu đồng ý.",
                  "Sau khôi phục, kiểm tra ngay số lượng hộ, nhân khẩu và một số hồ sơ mẫu.",
              ]),
              callout("Cảnh báo quan trọng", "Khôi phục có thể thay đổi hàng loạt dữ liệu hiện tại. Ứng dụng có cơ chế tạo bản an toàn trước khi khôi phục, nhưng vẫn phải coi đây là thao tác quản trị rủi ro cao.", "danger"),
              P("<b>15.3 Xuất danh sách</b>", "H2VN"),
              bullet([
                  "Bộ lọc hiện tại quyết định dữ liệu được xuất.",
                  "Có thể xuất CSV hoặc XLSX để tổng hợp; kiểm tra lại số lượng trước khi sử dụng.",
                  "File xuất có thể chứa dữ liệu nhạy cảm, phải quản lý như hồ sơ nghiệp vụ.",
              ])]

    # SOP
    story += section("16. Ba quy trình mẫu nên áp dụng")
    story += [P("<b>16.1 Tiếp nhận một hộ mới</b>", "H2VN"),
              numbered_steps([
                  "Tìm theo CCCD chủ hộ và địa chỉ để chắc chắn chưa có hộ.",
                  "Lập hộ khẩu mới và kiểm tra chủ hộ đầu tiên.",
                  "Thêm lần lượt các thành viên, chọn đúng quan hệ với chủ hộ.",
                  "Check-in tọa độ và đăng ảnh hộ khi có mặt tại địa chỉ.",
                  "Mở chi tiết hộ, kiểm tra tổng số thành viên, địa chỉ, ảnh và vị trí.",
              ]),
              P("<b>16.2 Rà soát hồ sơ thiếu dữ liệu</b>", "H2VN"),
              numbered_steps([
                  "Mở Điểm dữ liệu hoặc Phân tích và chọn chỉ số thiếu thông tin.",
                  "Xử lý từng hồ sơ theo nguồn xác minh, không sửa hàng loạt theo phỏng đoán.",
                  "Lưu, mở lại và kiểm tra lỗi đã hết.",
                  "Nếu chưa đủ căn cứ, tạo nhắc việc và ghi rõ thông tin cần bổ sung.",
              ]),
              P("<b>16.3 Bàn giao hoặc thay đổi nhiệm vụ cán bộ</b>", "H2VN"),
              numbered_steps([
                  "Xác định tài khoản, nhiệm vụ cũ và ngày kết thúc.",
                  "Bỏ các quyền không còn cần hoặc đặt Đến ngày.",
                  "Cập nhật chức danh, nhiệm vụ mới và phạm vi quyền mới.",
                  "Kiểm tra đăng nhập thử; lưu biên bản bàn giao ngoài hệ thống nếu quy trình đơn vị yêu cầu.",
              ])]

    # Troubleshooting
    story += section("17. Xử lý lỗi thường gặp và danh sách kiểm tra cuối")
    story += [data_table(["Hiện tượng", "Nguyên nhân thường gặp", "Cách xử lý"], [
                  ["Không đăng nhập được", "Sai email/mật khẩu, mất mạng", "Kiểm tra bàn phím, mạng và tài khoản với quản trị viên"],
                  ["Không thấy nút Thêm/Sửa", "Thiếu quyền hoặc hết thời hạn", "Kiểm tra quyền cụ thể và ngày hiệu lực"],
                  ["Không mở camera", "Chặn quyền hoặc camera đang được dùng", "Bật quyền Camera, đóng ứng dụng camera khác"],
                  ["Sai vị trí", "GPS yếu hoặc đứng xa nhà", "Ra vị trí thoáng, bật độ chính xác cao, chọn lại trên bản đồ"],
                  ["Không có kết quả lọc", "Đang kết hợp quá nhiều điều kiện", "Xóa dần bộ lọc, kiểm tra khoảng tuổi/ngày sinh"],
                  ["Ảnh không lưu", "Ảnh quá lớn, mạng yếu hoặc thiếu quyền", "Thử ảnh khác, chờ mạng ổn định và lưu lại"],
                  ["Số liệu phân tích lệch", "Hồ sơ thiếu hoặc nhập sai", "Rà soát Điểm dữ liệu trước khi báo cáo"],
              ], [4.2, 5.8, 7.0], font=7.7),
              P("<b>Danh sách kiểm tra trước khi kết thúc ca làm việc</b>", "H2VN"),
              bullet([
                  "Không còn hồ sơ vừa nhập ở trạng thái chưa kiểm tra.",
                  "Các hộ mới có đúng chủ hộ, địa chỉ và số thành viên.",
                  "Tọa độ và ảnh hộ đã mở lại xem được.",
                  "Các việc chưa xong đã có nhắc việc, người phụ trách và hạn.",
                  "File xuất/backup được lưu ở nơi an toàn và không để lại trên thiết bị dùng chung.",
                  "Đã đăng xuất nếu sử dụng máy chung.",
              ]),
              Spacer(1, 10),
              callout("Kết thúc", "Khi không chắc một thao tác có làm thay đổi hoặc xóa dữ liệu hay không, hãy dừng lại, chụp màn hình không chứa thông tin nhạy cảm và hỏi quản trị viên trước khi tiếp tục.", "ok")]

    doc.build(story, onFirstPage=lambda c, d: None, onLaterPages=footer)


if __name__ == "__main__":
    ensure_dirs()
    build_figures()
    build_pdf()
    print(PDF_PATH.name)
