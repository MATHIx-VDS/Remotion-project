"""Découpe les deux champions dans l'affiche officielle (le logo vient du fichier officiel du club, assets/logo-club.jpg).

python decoupe.py <affiche.png> <dossier_assets>

Les cadres sont en fractions de l'affiche : avec le fichier original en haute définition,
le même script découpe au même endroit, en meilleure qualité.
Agrandissement fidèle (Lanczos + légère accentuation), sans IA : aucun détail du visage n'est inventé.
Les visuels fondent ensuite les bords dans le noir (dégradés CSS), à la place d'un détourage.
"""
import sys

from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
aff = Image.open(SRC).convert('RGB')
W, H = aff.size
# (gauche, haut, droite, bas) en fractions de l'affiche ; on s'arrête au-dessus des noms imprimés
BOX = {
    'kevin': (0.000, 0.000, 0.326, 0.283),
    'chloe': (0.682, 0.042, 1.000, 0.280),
}


def crop(name):
    l, t, r, b = BOX[name]
    return aff.crop((round(l * W), round(t * H), round(r * W), round(b * H)))


def upscale(im, width):
    k = width / im.width
    big = im.resize((width, round(im.height * k)), Image.LANCZOS)
    return big.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))


for name, width in (('kevin', 1000), ('chloe', 1000)):
    c = crop(name)
    big = upscale(c, width)
    big.save(f'{OUT}/{name}.jpg', quality=95)
    print(name, c.size, '->', big.size, f'x{width / c.width:.2f}')
