---
title: "Warum wir den Self-Host-Deploy härten"
excerpt: "Coolify ist nicht der nächste sinnvolle Schritt. Der bessere Schritt ist ein reproduzierbarer, prüfbarer Deploy auf unserer bestehenden Hetzner-Infrastruktur."
author: "RevampIT Team"
featuredImage: "/blog/deploy-hardening.svg"
category: "Technik"
tags:
  - devops
  - hetzner
  - deployment
  - monitoring
  - ssot
publishedAt: "2026-06-16"
published: true
---

RevampIT läuft aktuell als Self-Host-App auf Hetzner unter `revampit.orangecat.ch`. Die öffentliche Domain `revamp-it.ch` zeigt noch auf die alte Joomla/Apache-Seite und ist deshalb nicht das Produktionsziel der neuen Plattform.

Die naheliegende Frage war: Brauchen wir Coolify, Dokploy oder eine andere Platform-as-a-Service-Schicht? Unsere Antwort für jetzt ist nein. Nicht, weil solche Werkzeuge schlecht sind, sondern weil sie nicht das erste Problem lösen.

Das eigentliche Problem ist simpler: Ein Deploy muss reproduzierbar sein, einen klaren Qualitäts-Gate haben, im Fehlerfall zurückrollen und sichtbar machen, welche Version gerade läuft. Diese Eigenschaften kann unsere bestehende Caddy-, systemd- und rsync-Struktur direkt bekommen, ohne eine neue Control Plane auf denselben Produktionsserver zu setzen.

Deshalb härten wir zuerst den vorhandenen Weg. Das Deploy-Skript baut weiterhin ein Next.js-Standalone-Artifact, kopiert es auf den Hetzner-Server und startet den Dienst neu. Neu ist, dass vor dem Aktivieren ein vorheriges Release erhalten bleibt. Wenn der Dienst nicht aktiv wird oder `/api/health` keinen erfolgreichen Status liefert, wird automatisch zurückgerollt.

Zusätzlich gibt es einen `/api/version`-Endpunkt. Er zeigt App-Version, Git-SHA und Build-Zeit. Das ist klein, aber wichtig: Betrieb und Monitoring brauchen eine eindeutige Antwort auf die Frage, was wirklich live läuft.

Ein Detail war dabei entscheidend: Runtime-Dateien wie `.env` und `launch.sh` gehören nicht in das Git-Repository, müssen aber in jedem aktivierten Release vorhanden sein. Das Deploy-Skript übernimmt diese Dateien deshalb serverlokal aus dem aktuellen App-Verzeichnis, bevor es ein neues Release startet.

Auch Meilisearch ist jetzt wieder Teil des Betriebsbilds. Die App konnte ohne Meilisearch auf SQL-Suche zurückfallen, aber `/api/health` war dadurch nur `degraded`. Auf dem Hetzner-Server läuft Meilisearch deshalb als localhost-only Docker-Service mit einem serverlokalen Schlüssel.

Der GitHub-Deploy-Workflow bekommt außerdem einen klareren Gate: Lint und Typecheck laufen vor dem Produktionsdeploy. Der lokale Push-Deploy bleibt praktisch, soll aber nicht die langfristige einzige Wahrheit sein. Der Zielzustand ist: GitHub baut, prüft und deployed; lokale Deploys bleiben ein manuelles Werkzeug für Ausnahmefälle.

Was später kommen kann: Wenn wir viele Apps, Kundenumgebungen oder Self-Service-Deploys betreiben, kann eine Control Plane sinnvoll werden. Dann prüfen wir nüchtern Coolify, Dokploy oder Kamal. Bis dahin gilt: weniger Plattform, mehr verlässliche Betriebsdisziplin.
