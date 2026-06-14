# Appart'Tri PWA

Version autonome, installable et utilisable hors ligne d'Appart'Tri.

## Principe

- Les annonces sont stockées localement dans le navigateur de chaque appareil.
- Aucun compte, serveur ou accès Internet n'est nécessaire après installation.
- Les appareils ne se synchronisent pas automatiquement.
- Le bouton **Exporter les données** crée une sauvegarde JSON.
- Le bouton **Importer une sauvegarde** permet de fusionner ou remplacer les
  données présentes sur l'appareil.

Lors d'une fusion, chaque annonce est reconnue grâce à son identifiant unique.
Si elle existe sur les deux appareils, la version modifiée le plus récemment
est conservée.

## Tester sur un ordinateur

Une PWA doit être servie par HTTP, et non ouverte directement avec
`file:///`. Depuis ce dossier :

```powershell
python -m http.server 8080
```

Ouvrez ensuite <http://localhost:8080>.

## Installer sur téléphone

Pour l'installation sur Android ou iPhone, les fichiers doivent être publiés
une première fois sur une adresse HTTPS. Un hébergement statique gratuit comme
GitHub Pages, Netlify ou Cloudflare Pages suffit.

- Android/Chrome : menu du navigateur, puis **Installer l'application**.
- iPhone/Safari : bouton **Partager**, puis **Sur l'écran d'accueil**.

Après cette première installation, l'application fonctionne hors ligne.

## Méthode de synchronisation conseillée

1. Avant de changer d'appareil, exportez les données de l'appareil à jour.
2. Transférez le fichier JSON par câble, AirDrop, Drive, e-mail, etc.
3. Sur l'autre appareil, ouvrez Appart'Tri et choisissez **Importer**.
4. Choisissez **Fusionner** pour conserver les annonces présentes des deux
   côtés, ou **Tout remplacer** si le fichier est votre référence complète.
5. Exportez régulièrement une sauvegarde vers un emplacement sûr.

## Fichiers

```text
AppartTri-PWA/
|-- index.html
|-- app.js
|-- style.css
|-- manifest.webmanifest
|-- service-worker.js
|-- README.md
`-- icons/
    `-- icon.svg
```
