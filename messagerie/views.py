from django.shortcuts import render
from django.http import JsonResponse
from .models import MessageContact, Newsletter
from django.core.mail import send_mail
from django.conf import settings # Utiliser django.conf est plus propre
from django.views.decorators.csrf import csrf_exempt
import json

# 1. Affiche le site (page d'accueil)
def page_accueil(request):
    return render(request, 'index.html')

# 2. Reçoit, Stocke les informations et envoie un Email
@csrf_exempt
def enregistrer_message(request):
    if request.method == 'POST':
        try:
            # Vérifier le contenu de la requête
            if not request.body:
                return JsonResponse({
                    "status": "error",
                    "message": "Corps de la requête vide"
                }, status=400)
            
            # On transforme le JSON reçu en dictionnaire Python
            try:
                donnees = json.loads(request.body)
            except json.JSONDecodeError as e:
                print(f"ERREUR JSON: {str(e)}")
                return JsonResponse({
                    "status": "error",
                    "message": f"JSON invalide: {str(e)}"
                }, status=400)
            
            # --- DEBUG : Affiche dans ton terminal pour vérification ---
            print("Données reçues par Zenon :", donnees) 

            # A. STOCKAGE DANS LA BASE DE DONNÉES (db.sqlite3)
            nouveau_message = MessageContact.objects.create(
                nom=donnees.get('nom'),
                email=donnees.get('email'),
                sujet=donnees.get('sujet'),
                motif=donnees.get('motif'),
                message=donnees.get('message')
            )
            # Pas besoin d'appeler .save() après .create()

            print(f"Étape 1 : Message de {nouveau_message.nom} enregistré en base.")

            # B. ENVOI DU GMAIL DE NOTIFICATION (séparé pour ne pas bloquer)
            email_envoye = False
            try:
                sujet_alerte = f"SITE ASBL : Nouveau message de {donnees.get('nom')}"
                
                corps_du_mail = f"""
            Bonjour Zenon,
            
            Une nouvelle personne a contacté l'ASBL via le site :
            
            - Nom complet : {donnees.get('nom')}
            - Son Email : {donnees.get('email')}
            - Sujet : {donnees.get('sujet')}
            - Motif : {donnees.get('motif')}
            
            --- MESSAGE : ---
            {donnees.get('message')}
            
            ------------------
            Ce message est également enregistré dans ton tableau de bord Django.
            """

                send_mail(
                    sujet_alerte,
                    corps_du_mail,
                    settings.EMAIL_HOST_USER,  # L'expéditeur (ton compte Gmail)
                    ['uzimamzenon@gmail.com'], # Le destinataire (ton Gmail personnel)
                    fail_silently=False,      # Affiche l'erreur si le mail ne part pas
                )
                email_envoye = True
                print(f"Étape 2 : Email envoyé à {settings.EMAIL_HOST_USER}.")
            except Exception as email_error:
                print(f"ERREUR EMAIL (non bloquante) : {str(email_error)}")

            return JsonResponse({
                "status": "success",
                "message": "Félicitations Zenon, c'est enregistré !",
                "email_envoye": email_envoye
            }, status=201)

        except Exception as e:
            import traceback
            print("ERREUR RENCONTRÉE :", str(e))
            print("TRACEBACK:", traceback.format_exc())
            return JsonResponse({
                "status": "error",
                "message": f"Désolé Zenon, ça a échoué : {str(e)}"
            }, status=400)
            
    return JsonResponse({"message": "Erreur : Seule la méthode POST est autorisée"}, status=405)


# 3. Inscription à la newsletter
@csrf_exempt
def enregistrer_newsletter(request):
    if request.method == 'POST':
        try:
            donnees = json.loads(request.body)
            email = donnees.get('email', '').strip()
            
            if not email:
                return JsonResponse({
                    "status": "error",
                    "message": "L'adresse email est requise."
                }, status=400)
            
            # Vérifier si l'email existe déjà
            if Newsletter.objects.filter(email=email).exists():
                return JsonResponse({
                    "status": "warning",
                    "message": "Cette adresse est déjà inscrite à notre newsletter."
                }, status=200)
            
            # Créer l'inscription
            Newsletter.objects.create(email=email)
            print(f"Newsletter : Nouvelle inscription - {email}")
            
            return JsonResponse({
                "status": "success",
                "message": "Merci ! Vous êtes maintenant inscrit à notre newsletter."
            }, status=201)
            
        except Exception as e:
            print(f"ERREUR Newsletter : {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": f"Erreur lors de l'inscription : {str(e)}"
            }, status=400)
    
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)