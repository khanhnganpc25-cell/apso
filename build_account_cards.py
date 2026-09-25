import json
import os
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parent
DATA = ROOT / "tmp" / "account-migration" / "new-accounts-private.json"
OUTPUT = ROOT / "output" / "pdf" / "Phieu-tai-khoan-APSO-Ap-Ta-Quang-Ty.pdf"
LOGO = ROOT / "hosting-public" / "icons" / "apso-192.png"

PAGE_W, PAGE_H = A4
MARGIN_X = 8 * mm
MARGIN_Y = 8 * mm
GAP = 5 * mm
CARD_W = (PAGE_W - 2 * MARGIN_X - GAP) / 2
CARD_H = (PAGE_H - 2 * MARGIN_Y - GAP) / 2


def register_fonts():
    candidates = {
        "APSO": [r"C:\Windows\Fonts\arial.ttf", r"C:\Windows\Fonts\segoeui.ttf"],
        "APSO-Bold": [r"C:\Windows\Fonts\arialbd.ttf", r"C:\Windows\Fonts\segoeuib.ttf"],
        "APSO-Mono": [r"C:\Windows\Fonts\consola.ttf", r"C:\Windows\Fonts\cour.ttf"],
        "APSO-Mono-Bold": [r"C:\Windows\Fonts\consolab.ttf", r"C:\Windows\Fonts\courbd.ttf"],
    }
    for name, paths in candidates.items():
        for font_path in paths:
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont(name, font_path))
                break
        else:
            raise FileNotFoundError(f"Không tìm thấy font cho {name}")


def draw_paragraph(c, text, x, y_top, width, style, max_height=40 * mm):
    paragraph = Paragraph(text, style)
    _, height = paragraph.wrap(width, max_height)
    paragraph.drawOn(c, x, y_top - height)
    return y_top - height


def compact_permissions(labels):
    mapping = {
        "Xem nhân khẩu": "Xem nhân khẩu",
        "Thêm nhân khẩu": "Thêm nhân khẩu",
        "Sửa nhân khẩu": "Sửa nhân khẩu",
        "Xem hộ khẩu": "Xem hộ khẩu",
        "Thêm hộ khẩu": "Thêm hộ khẩu",
        "Sửa hộ khẩu": "Sửa hộ khẩu",
        "Xem báo cáo": "Xem báo cáo",
        "Gửi báo cáo": "Gửi báo cáo",
        "Duyệt báo cáo": "Duyệt báo cáo",
        "Xem nhiệm vụ": "Xem nhiệm vụ",
        "Phân công nhiệm vụ": "Phân công nhiệm vụ",
        "Cập nhật việc được giao": "Cập nhật việc được giao",
        "Duyệt hoàn thành nhiệm vụ": "Duyệt nhiệm vụ",
        "Xuất dữ liệu": "Xuất dữ liệu",
        "Xem thông tin nhạy cảm": "Xem thông tin nhạy cảm",
        "Xem ảnh/tọa độ": "Xem ảnh và tọa độ",
    }
    return [mapping.get(item, item) for item in labels]


def draw_card(c, account, number, x, y):
    blue = colors.HexColor("#1455D9")
    green = colors.HexColor("#0FB981")
    dark = colors.HexColor("#0F172A")
    muted = colors.HexColor("#475569")
    light = colors.HexColor("#EFF6FF")
    border = colors.HexColor("#CBD5E1")

    c.setFillColor(colors.white)
    c.setStrokeColor(border)
    c.setLineWidth(0.8)
    c.roundRect(x, y, CARD_W, CARD_H, 3 * mm, stroke=1, fill=1)

    header_h = 24 * mm
    c.saveState()
    path = c.beginPath()
    path.roundRect(x, y + CARD_H - header_h, CARD_W, header_h, 3 * mm)
    c.clipPath(path, stroke=0, fill=0)
    c.setFillColor(blue)
    c.rect(x, y + CARD_H - header_h, CARD_W * 0.62, header_h, stroke=0, fill=1)
    c.setFillColor(green)
    c.rect(x + CARD_W * 0.62, y + CARD_H - header_h, CARD_W * 0.38, header_h, stroke=0, fill=1)
    c.restoreState()

    if LOGO.exists():
        c.drawImage(str(LOGO), x + 5 * mm, y + CARD_H - 19 * mm, 12 * mm, 12 * mm, mask="auto")
    c.setFillColor(colors.white)
    c.setFont("APSO-Bold", 13)
    c.drawString(x + 20 * mm, y + CARD_H - 11 * mm, "TÀI KHOẢN APSO")
    c.setFont("APSO", 7.5)
    c.drawString(x + 20 * mm, y + CARD_H - 16 * mm, "ẤP TẠ QUANG TỶ")
    c.setFont("APSO-Bold", 8)
    c.drawRightString(x + CARD_W - 5 * mm, y + CARD_H - 11 * mm, f"PHIẾU {number:02d}/16")

    title_style = ParagraphStyle(
        "title",
        fontName="APSO-Bold",
        fontSize=10.5,
        leading=12,
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=0,
    )
    body_style = ParagraphStyle(
        "body",
        fontName="APSO",
        fontSize=7.4,
        leading=9.2,
        textColor=muted,
        alignment=TA_LEFT,
    )
    label_style = ParagraphStyle(
        "label",
        fontName="APSO-Bold",
        fontSize=7.3,
        leading=9,
        textColor=dark,
        alignment=TA_LEFT,
    )
    rights_style = ParagraphStyle(
        "rights",
        fontName="APSO",
        fontSize=6.7,
        leading=8.2,
        textColor=muted,
        alignment=TA_LEFT,
    )
    note_style = ParagraphStyle(
        "note",
        fontName="APSO",
        fontSize=6.5,
        leading=7.8,
        textColor=colors.HexColor("#334155"),
        alignment=TA_LEFT,
    )

    inner_x = x + 5 * mm
    inner_w = CARD_W - 10 * mm
    cursor = y + CARD_H - header_h - 5 * mm
    cursor = draw_paragraph(c, account["name"], inner_x, cursor, inner_w, title_style, 16 * mm)
    cursor -= 2 * mm

    c.setFillColor(light)
    c.roundRect(inner_x, cursor - 31 * mm, inner_w, 31 * mm, 2 * mm, stroke=0, fill=1)
    c.setFillColor(dark)
    c.setFont("APSO-Bold", 7)
    c.drawString(inner_x + 3 * mm, cursor - 6 * mm, "TRANG ĐĂNG NHẬP")
    c.setFont("APSO", 7.5)
    c.drawString(inner_x + 3 * mm, cursor - 11 * mm, "https://apso-vn.web.app/")
    c.setFont("APSO-Bold", 7)
    c.drawString(inner_x + 3 * mm, cursor - 17 * mm, "TÀI KHOẢN")
    c.setFont("APSO-Mono-Bold", 8.4)
    c.drawString(inner_x + 3 * mm, cursor - 22 * mm, account["email"])
    c.setFont("APSO-Bold", 7)
    c.drawString(inner_x + 3 * mm, cursor - 28 * mm, "MẬT KHẨU TẠM")
    c.setFont("APSO-Mono-Bold", 9.2)
    c.setFillColor(blue)
    c.drawRightString(inner_x + inner_w - 3 * mm, cursor - 28 * mm, account["password"])
    cursor -= 35 * mm

    c.setStrokeColor(border)
    c.setLineWidth(0.45)
    c.line(inner_x, cursor, inner_x + inner_w, cursor)
    cursor -= 3.5 * mm
    cursor = draw_paragraph(
        c,
        "<b>Phạm vi:</b> An Giang / Xã Vĩnh Hòa Hưng / Ấp Tạ Quang Tỷ",
        inner_x,
        cursor,
        inner_w,
        body_style,
        10 * mm,
    )
    cursor -= 1.5 * mm
    cursor = draw_paragraph(
        c,
        f"<b>Nhiệm vụ:</b> {account['assignedDuties']}",
        inner_x,
        cursor,
        inner_w,
        body_style,
        18 * mm,
    )
    cursor -= 2 * mm
    cursor = draw_paragraph(c, "QUYỀN ĐƯỢC CẤP", inner_x, cursor, inner_w, label_style, 8 * mm)
    rights = compact_permissions(account["permissionLabels"])
    rights_text = " • ".join(rights)
    cursor = draw_paragraph(c, rights_text, inner_x, cursor - 1 * mm, inner_w, rights_style, 27 * mm)

    note_y = y + 6 * mm
    c.setFillColor(colors.HexColor("#ECFDF5"))
    c.roundRect(inner_x, note_y, inner_w, 14 * mm, 2 * mm, stroke=0, fill=1)
    draw_paragraph(
        c,
        "<b>Bảo mật:</b> Không cho mượn tài khoản, không gửi mật khẩu qua nhóm chat. "
        "Mục Quản trị đã ẩn. Khi cần cấp lại mật khẩu, liên hệ Quản trị APSO.",
        inner_x + 3 * mm,
        note_y + 11 * mm,
        inner_w - 6 * mm,
        note_style,
        11 * mm,
    )


def build():
    register_fonts()
    payload = json.loads(DATA.read_text(encoding="utf-8"))
    accounts = payload["accounts"]
    if len(accounts) != 16:
        raise ValueError(f"Cần đúng 16 tài khoản, nhận được {len(accounts)}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=A4)
    c.setTitle("Phiếu tài khoản APSO - Ấp Tạ Quang Tỷ")
    c.setAuthor("APSO")
    for page_start in range(0, len(accounts), 4):
        positions = [
            (MARGIN_X, PAGE_H - MARGIN_Y - CARD_H),
            (MARGIN_X + CARD_W + GAP, PAGE_H - MARGIN_Y - CARD_H),
            (MARGIN_X, MARGIN_Y),
            (MARGIN_X + CARD_W + GAP, MARGIN_Y),
        ]
        for offset, account in enumerate(accounts[page_start : page_start + 4]):
            draw_card(c, account, page_start + offset + 1, *positions[offset])

        c.saveState()
        c.setStrokeColor(colors.HexColor("#94A3B8"))
        c.setDash(3, 3)
        c.setLineWidth(0.55)
        middle_x = PAGE_W / 2
        middle_y = PAGE_H / 2
        c.line(middle_x, 3 * mm, middle_x, PAGE_H - 3 * mm)
        c.line(3 * mm, middle_y, PAGE_W - 3 * mm, middle_y)
        c.setDash()
        c.setFont("APSO", 6)
        c.setFillColor(colors.HexColor("#64748B"))
        c.drawCentredString(middle_x, PAGE_H - 4.8 * mm, "ĐƯỜNG CẮT")
        c.drawCentredString(middle_x, 2.7 * mm, "ĐƯỜNG CẮT")
        c.restoreState()
        c.showPage()
    c.save()
    print(str(OUTPUT).encode("ascii", "backslashreplace").decode("ascii"))


if __name__ == "__main__":
    build()
