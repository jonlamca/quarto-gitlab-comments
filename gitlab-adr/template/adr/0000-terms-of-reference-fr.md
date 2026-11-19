# Cadre de référence

Ce cadre établit comment le [nom du comité, par exemple TIGER] examine et consigne les décisions d'architecture. Il constitue la décision 0000; il se modifie donc comme toute décision, au moyen d'une demande de fusion soumise au vote du comité. Remplacez tout ce qui figure entre [crochets].

## Objet

Le comité examine les décisions d'architecture proposées pour [portée, par exemple le Programme des développeurs de StatCan] et consigne celles qu'il accepte. Les décisions acceptées orientent [qui, par exemple toutes les équipes qui utilisent les plateformes du programme].

## Composition

- **Présidence :** [nom ou rôle]. La présidence a le rôle Maintainer dans ce projet GitLab.
- **Membres :** [noms ou rôles]. Les membres ont le rôle Reporter ou un rôle supérieur.
- **Auteurs :** toute personne ayant le rôle Developer peut proposer une décision. Les autres peuvent demander à un membre de la proposer en leur nom.
- La composition est modifiée par [qui], et la liste des membres du projet GitLab est tenue à jour en conséquence.

## Proposer une décision

1. Reprenez le plan d'une décision existante et rédigez-la en anglais et en français : `NNNN-nom-court-en.md` et `NNNN-nom-court-fr.md` dans le dossier des décisions. Utilisez le prochain numéro libre.
2. Placez les deux fichiers dans une nouvelle branche et ouvrez une demande de fusion vers la branche par défaut. Commencez son titre par [RFC] (ou par le préfixe configuré sur le site des décisions), par exemple « [RFC] Adopter PostgreSQL ». Une demande de fusion peut regrouper plusieurs décisions liées et des fichiers d'appui; le comité les vote ensemble.
3. Informez le comité, par exemple dans [canal ou réunion].

Une proposition ne peut pas être acceptée tant que les deux versions linguistiques ne sont pas présentes.

## Examen et vote

- **Discussion :** elle a lieu dans la demande de fusion, sur le site des décisions ou dans GitLab. Les membres peuvent commenter l'ensemble de la proposition, un fichier ou un paragraphe. La présidence peut consigner les commentaires faits par les membres lors d'une réunion.
- **Vote :** chaque membre dispose d'un vote, Pour ou Contre, exprimé sur le site des décisions ou par une réaction 👍 ou 👎 sur la demande de fusion. Les votes sont visibles par toutes les personnes qui ont accès au projet.
- **Période de vote :** [par exemple, 10 jours ouvrables après l'ouverture de la demande de fusion, ou jusqu'à la prochaine réunion].
- **Quorum :** [par exemple, la majorité des membres a voté].
- **Règle de décision :** [par exemple, la majorité simple des votes exprimés; la présidence tranche en cas d'égalité].

## Décisions

- À la fin de la période de vote, si le quorum est atteint, la présidence accepte la proposition (fusionne la demande de fusion) ou la rejette (ferme la demande de fusion), selon la règle de décision.
- Le site des décisions ajoute le décompte final à la demande de fusion; GitLab en conserve ainsi la trace.
- Si de nouveaux commits sont ajoutés après le début du vote, la présidence [par exemple, demande aux membres de confirmer leur vote] avant d'accepter.
- Une décision acceptée est remplacée ou retirée par une nouvelle proposition qui la modifie ou la remplace.

## Révision du présent cadre

Le comité révise ce cadre [par exemple, chaque année] et le modifie au moyen d'une demande de fusion portant sur ce fichier et sa version anglaise.
