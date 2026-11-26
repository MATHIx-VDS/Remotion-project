# Bande-son du carrousel

| Étape | Outil | Licence |
|---|---|---|
| Voix off | Kokoro-82M, voix française `ff_siwis` (`voix.py`) : vitesse 1,2 pour les 2 phrases de la slide 1, 1,1 pour les autres | Apache 2.0, usage commercial sans attribution |
| Musique | ACE-Step 1.5 turbo sur CPU (`musique.py`), graine 7 retenue sur 3 essais (≈ 97 BPM) | musique générée utilisable commercialement |
| Bruitages | synthétisés (`bruitages.py`) : cloche de ring, whoosh, coup de poing, grelots | originaux, libres |
| Mixage | ffmpeg (`mix.py`) : voix -16 LUFS, musique 15 dB sous la voix pendant qu'elle parle (ducking 8 dB), fondu de la musique sur la dernière seconde, master -14 LUFS / -1 dBTP | |

Repères (détection de scène ffmpeg) : slides à 0 / 2,93 / 6,03 / 9,03 / 12,03 s, BAM à 1,15 s, COMBO X2 à 6,87 s, bouton « Lien en bio » à 12,88 s.

Pour utiliser des sons Pixabay à la place des bruitages synthétisés : déposer `cloche.mp3`, `whoosh.mp3`, `coup.mp3`, `grelots.mp3`
(et/ou `musique.mp3`) dans `<dossier_son>/pixabay/`, puis relancer `mix.py`. Ils remplacent automatiquement la version par défaut.
