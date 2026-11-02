import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_app_icon(size=1024, is_foreground_only=False, is_background_only=False, is_monochrome=False):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    scale = size / 1024.0
    cx, cy = size / 2.0, size / 2.0
    
    # 1. Background
    if not is_foreground_only and not is_monochrome:
        # Radial background gradient
        for r in range(int(size * 0.75), 0, -8):
            factor = r / (size * 0.75)
            # Center #161F38, Outer #080C16
            red = int(8 + (22 - 8) * (1 - factor))
            green = int(12 + (31 - 12) * (1 - factor))
            blue = int(22 + (56 - 22) * (1 - factor))
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(red, green, blue, 255))
        
        # Subtle glowing ring
        ring_r = int(460 * scale)
        draw.ellipse([cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r], outline=(6, 182, 212, 40), width=int(3 * scale))

    if is_background_only:
        return img

    # 2. Central Squircle Badge (Safe area radius ~320px)
    badge_w = int(580 * scale)
    badge_h = int(580 * scale)
    badge_x0 = int(cx - badge_w / 2)
    badge_y0 = int(cy - badge_h / 2 + 10 * scale)
    badge_x1 = badge_x0 + badge_w
    badge_y1 = badge_y0 + badge_h
    corner_r = int(140 * scale)

    if not is_monochrome:
        # Draw gradient badge on separate surface
        badge_img = Image.new('RGBA', (badge_w, badge_h), (0, 0, 0, 0))
        badge_draw = ImageDraw.Draw(badge_img)
        
        # Linear vertical/diagonal gradient: #4F46E5 (Indigo) -> #7C3AED (Purple) -> #06B6D4 (Cyan)
        for y in range(badge_h):
            t = y / float(badge_h)
            if t < 0.5:
                # Indigo to Purple
                p = t / 0.5
                r = int(79 + (124 - 79) * p)
                g = int(70 + (58 - 70) * p)
                b = int(229 + (237 - 229) * p)
            else:
                # Purple to Cyan
                p = (t - 0.5) / 0.5
                r = int(124 + (6 - 124) * p)
                g = int(58 + (182 - 58) * p)
                b = int(237 + (212 - 237) * p)
            badge_draw.line([(0, y), (badge_w, y)], fill=(r, g, b, 255))
        
        # Create rounded mask
        mask = Image.new('L', (badge_w, badge_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, badge_w, badge_h], radius=corner_r, fill=255)
        
        # Composite badge onto main image
        img.paste(badge_img, (badge_x0, badge_y0), mask)
        
        # Subtle badge border
        draw.rounded_rectangle([badge_x0, badge_y0, badge_x1, badge_y1], radius=corner_r, outline=(255, 255, 255, 60), width=int(3 * scale))

    # 3. Educational / Graduation Cap Emblem (White + Cyan)
    icon_color = (255, 255, 255, 255)
    accent_color = (6, 182, 212, 255) if not is_monochrome else (255, 255, 255, 255)
    
    # Cap Center coordinates
    cap_cy = cy - 40 * scale
    
    # Mortarboard Rhombus Top: (cx, cap_cy - 120), (cx + 210, cap_cy - 30), (cx, cap_cy + 60), (cx - 210, cap_cy - 30)
    p_top = (cx, cap_cy - 120 * scale)
    p_right = (cx + 210 * scale, cap_cy - 30 * scale)
    p_bottom = (cx, cap_cy + 60 * scale)
    p_left = (cx - 210 * scale, cap_cy - 30 * scale)
    
    draw.polygon([p_top, p_right, p_bottom, p_left], fill=icon_color)
    
    # Cap Skull Underneath
    skull_top = cap_cy + 10 * scale
    skull_w = 120 * scale
    skull_h = 75 * scale
    draw.polygon([
        (cx - skull_w, skull_top),
        (cx + skull_w, skull_top),
        (cx + skull_w * 0.8, skull_top + skull_h),
        (cx - skull_w * 0.8, skull_top + skull_h)
    ], fill=(240, 243, 250, 255) if not is_monochrome else (255, 255, 255, 255))
    
    # Tassel Button
    btn_r = int(12 * scale)
    draw.ellipse([cx - btn_r, cap_cy - 30 * scale - btn_r, cx + btn_r, cap_cy - 30 * scale + btn_r], fill=accent_color)
    
    # Tassel Ribbon hanging to left
    draw.line([(cx, cap_cy - 30 * scale), (cx - 160 * scale, cap_cy + 25 * scale)], fill=accent_color, width=int(7 * scale))
    draw.ellipse([cx - 168 * scale, cap_cy + 20 * scale, cx - 148 * scale, cap_cy + 45 * scale], fill=accent_color)

    # 4. Open Book Underneath (Two Curved Pages)
    book_y = cy + 105 * scale
    book_w = 175 * scale
    page_h = 55 * scale
    
    # Left Page
    draw.polygon([
        (cx - 10 * scale, book_y),
        (cx - book_w, book_y - 15 * scale),
        (cx - book_w, book_y + page_h - 15 * scale),
        (cx - 10 * scale, book_y + page_h)
    ], fill=icon_color)
    
    # Right Page
    draw.polygon([
        (cx + 10 * scale, book_y),
        (cx + book_w, book_y - 15 * scale),
        (cx + book_w, book_y + page_h - 15 * scale),
        (cx + 10 * scale, book_y + page_h)
    ], fill=icon_color)
    
    # Center spine
    draw.line([(cx, book_y - 8 * scale), (cx, book_y + page_h + 8 * scale)], fill=accent_color, width=int(5 * scale))

    # 5. Nova 4-point Star Accent in upper right corner
    star_x = cx + 185 * scale
    star_y = cy - 170 * scale
    star_r1 = 38 * scale
    star_r2 = 10 * scale
    
    star_points = []
    for i in range(8):
        angle = i * (math.pi / 4.0)
        dist = star_r1 if i % 2 == 0 else star_r2
        star_points.append((star_x + math.cos(angle) * dist, star_y + math.sin(angle) * dist))
    
    draw.polygon(star_points, fill=accent_color)

    return img

if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(root_dir, 'StudentManagerApp', 'assets')
    res_dir = os.path.join(root_dir, 'StudentManagerApp', 'android', 'app', 'src', 'main', 'res')
    
    os.makedirs(assets_dir, exist_ok=True)
    
    print('Generating official Nova Student Manager icons...')
    
    # 1. Main Icon (1024x1024)
    icon_main = create_app_icon(1024)
    icon_main.save(os.path.join(assets_dir, 'icon.png'))
    print('Saved assets/icon.png (1024x1024)')
    
    # 2. Android Adaptive Foreground (1024x1024 with transparent background)
    icon_fg = create_app_icon(1024, is_foreground_only=True)
    icon_fg.save(os.path.join(assets_dir, 'android-icon-foreground.png'))
    print('Saved assets/android-icon-foreground.png')
    
    # 3. Android Adaptive Background (1024x1024 solid dark)
    icon_bg = create_app_icon(1024, is_background_only=True)
    icon_bg.save(os.path.join(assets_dir, 'android-icon-background.png'))
    print('Saved assets/android-icon-background.png')
    
    # 4. Android Monochrome Icon
    icon_mono = create_app_icon(1024, is_monochrome=True)
    icon_mono.save(os.path.join(assets_dir, 'android-icon-monochrome.png'))
    print('Saved assets/android-icon-monochrome.png')
    
    # 5. Splash Screen Icon
    icon_splash = create_app_icon(512, is_foreground_only=True)
    icon_splash.save(os.path.join(assets_dir, 'splash-icon.png'))
    print('Saved assets/splash-icon.png')
    
    # 6. Favicon (64x64)
    icon_fav = create_app_icon(64)
    icon_fav.save(os.path.join(assets_dir, 'favicon.png'))
    print('Saved assets/favicon.png')

    # 7. Update Android mipmap launcher icons & purge old webps
    legacy_sizes = {
        'mipmap-mdpi': 48,
        'mipmap-hdpi': 72,
        'mipmap-xhdpi': 96,
        'mipmap-xxhdpi': 144,
        'mipmap-xxxhdpi': 192,
    }
    adaptive_sizes = {
        'mipmap-mdpi': 108,
        'mipmap-hdpi': 162,
        'mipmap-xhdpi': 216,
        'mipmap-xxhdpi': 324,
        'mipmap-xxxhdpi': 432,
    }

    for folder in legacy_sizes.keys():
        folder_path = os.path.join(res_dir, folder)
        if os.path.exists(folder_path):
            # Remove any old webp files that override pngs
            for f in os.listdir(folder_path):
                if f.endswith('.webp'):
                    os.remove(os.path.join(folder_path, f))
                    print(f'Removed obsolete {folder}/{f}')

            # Standard legacy icons
            leg_px = legacy_sizes[folder]
            resized_main = icon_main.resize((leg_px, leg_px), Image.Resampling.LANCZOS)
            resized_main.save(os.path.join(folder_path, 'ic_launcher.png'))
            resized_main.save(os.path.join(folder_path, 'ic_launcher_round.png'))

            # Adaptive foreground / background / monochrome (Android 8.0+)
            adp_px = adaptive_sizes[folder]
            resized_fg = icon_fg.resize((adp_px, adp_px), Image.Resampling.LANCZOS)
            resized_fg.save(os.path.join(folder_path, 'ic_launcher_foreground.png'))

            resized_bg = icon_bg.resize((adp_px, adp_px), Image.Resampling.LANCZOS)
            resized_bg.save(os.path.join(folder_path, 'ic_launcher_background.png'))

            resized_mono = icon_mono.resize((adp_px, adp_px), Image.Resampling.LANCZOS)
            resized_mono.save(os.path.join(folder_path, 'ic_launcher_monochrome.png'))

            print(f'Updated {folder} (legacy {leg_px}px, adaptive {adp_px}px)')

    print('All official app icons generated successfully!')

