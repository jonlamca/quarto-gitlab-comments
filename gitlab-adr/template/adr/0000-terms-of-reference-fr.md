# Cadre de référence

Ce cadre établit comment le [nom du comité, par exemple TIGER] examine et consigne les décisions d'architecture. Il constitue la décision 0000; il se modifie donc comme toute décision, au moyen d'une demande de fusion soumise au vote du comité. Remplacez tout ce qui figure entre [crochets].

## Objet

Le comité examine les décisions d'architecture proposées pour [portée, par exemple le Programme des développeurs de StatCan] et consigne celles qu'il accepte. Les décisions acceptées orientent [qui, par exemple toutes les équipes qui utilisent les plateformes du programme].

## Composition

- **Présidence :** [nom ou rôle]. La présidence a le rôle Maintainer dans ce projet GitLab.
- **Membres :** [noms ou rôles]. La liste des membres du site des décisions (`members.json` dans le dossier des décisions) est la liste officielle : seuls les votes des personnes qui y figurent comptent. Les membres doivent avoir le rôle Reporter ou un rôle supérieur pour participer.
- **Auteurs :** toute personne ayant le rôle Developer peut inscrire une proposition à l'ordre du jour d'une réunion. Les autres peuvent demander à un membre de le faire en leur nom.
- L'accès au projet GitLab ne fait pas d'une personne un membre. La composition est modifiée par [qui], et la présidence met à jour la liste des membres sur le site des décisions.

## Proposer une décision

1. Reprenez le plan d'une décision existante et rédigez-la en anglais et en français : `NNNN-nom-court-en.md` et `NNNN-nom-court-fr.md` dans le dossier des décisions. Utilisez le prochain numéro libre.
2. Ajoutez les deux fichiers à la branche de la réunion où la proposition sera discutée. Chaque réunion a une demande de fusion vers la branche par défaut, nommée d'après elle, par exemple « 2026-11-20 - Meeting ». Chaque décision qu'elle contient est une proposition distincte.
3. Informez le comité, par exemple dans [canal ou réunion].

Une proposition ne peut pas être acceptée tant que les deux versions linguistiques ne sont pas présentes.

## Examen et vote

- **Discussion :** elle a lieu dans la demande de fusion de la réunion, sur le site des décisions ou dans GitLab. Toute personne ayant accès peut commenter en marge d'un paragraphe, sur une proposition ou sur la réunion. La présidence peut consigner les commentaires faits par les membres lors d'une réunion.
- **Vote :** chaque membre dispose d'un vote par proposition, Pour ou Contre, exprimé sur le site des décisions ou par une réaction 👍 ou 👎 sur le commentaire de vote de la proposition dans GitLab. Les votes sont visibles par toutes les personnes qui ont accès au projet.
- **Période de vote :** [par exemple, 10 jours ouvrables après l'ouverture de la demande de fusion, ou jusqu'à la prochaine réunion].
- **Quorum :** [par exemple, la majorité des membres a voté].
- **Règle de décision :** [par exemple, la majorité simple des votes exprimés; la présidence tranche en cas d'égalité].

## Décisions

- À la fin de la période de vote, si le quorum est atteint, la présidence accepte ou rejette chaque proposition, selon la règle de décision. Le site des décisions consigne le décompte final sur le commentaire de vote de la proposition; GitLab en conserve ainsi la trace.
- La présidence clôture ensuite la réunion. Les propositions acceptées sont fusionnées dans la branche par défaut. Les propositions rejetées, et celles qui n'ont pas été tranchées, sont retirées de la demande de fusion; un auteur peut inscrire une proposition reportée à l'ordre du jour d'une réunion ultérieure.
- Si de nouveaux commits sont ajoutés après le début du vote, la présidence [par exemple, demande aux membres de confirmer leur vote] avant de trancher.
- Une décision acceptée est remplacée ou retirée par une nouvelle proposition qui la modifie ou la remplace.

## Révision du présent cadre

Le comité révise ce cadre [par exemple, chaque année] et le modifie au moyen d'une demande de fusion portant sur ce fichier et sa version anglaise.
