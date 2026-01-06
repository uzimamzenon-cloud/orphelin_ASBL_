from django.shortcuts import render
from django.http import JsonResponse
from .models import MessageContact, Newsletter
from django.core.mail import EmailMessage
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
import threading
import logging
import traceback

# Configuration du logger professionnel
logger = logging.getLogger('django')

# 1. Affiche le site (page d'accueil)
def page_accueil(request):
    return render(request, 'index.html')

# Fonction utilitaire pour envoyer l'email en arrière-plan
def send_email_background(sujet, corps, destinataire, reply_to):
    """
    Envoie un email de manière asynchrone pour ne pas bloquer la requête HTTP.
    Les erreurs sont logguées silencieusement pour ne pas perturber le thread principal.
    """
    try:
        email = EmailMessage(
            subject=sujet,
            body=corps,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[destinataire],
            reply_to=[reply_to],
        )
        email.send(fail_silently=False)
        logger.info(f"EMAIL SUCCÈS: Notification envoyée à {destinataire}")
    except Exception as e:
        logger.error(f"EMAIL ERREUR (Background): Impossible d'envoyer l'email : {str(e)}")

# 2. Reçoit, Stocke les informations et envoie un Email
@csrf_exempt
def enregistrer_message(request):
    if request.method == 'POST':
        try:
            # Vérification basique du corps de la requête
            if not request.body:
                logger.warning("REQUÊTE VIDE: Tentative d'envoi sans données.")
                return JsonResponse({
                    "status": "error",
                    "message": "Corps de la requête vide"
                }, status=400)
            
            # Parsing JSON
            try:
                donnees = json.loads(request.body)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON INVALIDE: {str(e)}")
                return JsonResponse({
                    "status": "error",
                    "message": "Format des données invalide."
                }, status=400)
            
            logger.info(f"NOUVEAU MESSAGE REÇU: De {donnees.get('email')}")

            # A. STOCKAGE BDD (Prioritaire)
            try:
                nouveau_message = MessageContact.objects.create(
                    nom=donnees.get('nom'),
                    email=donnees.get('email'),
                    sujet=donnees.get('sujet'),
                    motif=donnees.get('motif'),
                    message=donnees.get('message')
                )
                logger.info(f"DB SUCCÈS: Message {nouveau_message.id} sauvegardé.")
            except Exception as db_error:
                logger.critical(f"DB ERREUR: Impossible de sauvegarder le message : {str(db_error)}")
                return JsonResponse({
                    "status": "error",
                    "message": "Erreur technique lors de la sauvegarde. Veuillez réessayer."
                }, status=500)

            # B. ENVOI EMAIL (Asynchrone / Non-bloquant)
            # On prépare le contenu
            sujet_alerte = f"NOUVEAU CONTACT : {donnees.get('nom')}"
            corps_du_mail = f"""
            Bonjour Zenon,
            
            Un nouveau message a été reçu via le site web.
            
            DÉTAILS DU CONTACT :
            --------------------
            Nom     : {donnees.get('nom')}
            Email   : {donnees.get('email')}
            Sujet   : {donnees.get('sujet')}
            Motif   : {donnees.get('motif')}
            
            MESSAGE :
            ---------
            {donnees.get('message')}
            
            --------------------
            Note: Ce message est archivé dans la base de données Django.
            """
            
            # Lancement du thread
            admin_email = 'uzimamzenon@gmail.com' 
            email_thread = threading.Thread(
                target=send_email_background,
                args=(sujet_alerte, corps_du_mail, admin_email, donnees.get('email'))
            )
            email_thread.daemon = True 
            email_thread.start()

            # Réponse immédiate au client (Performance < 500ms)
            return JsonResponse({
                "status": "success",
                "message": "Message envoyé avec succès !",
                "email_envoye": "processed_in_background" 
            }, status=201)

        except Exception as e:
            # Gestion globale des erreurs imprévues
            logger.error(f"ERREUR CRITIQUE VUE CONTACT: {str(e)}")
            logger.error(traceback.format_exc())
            return JsonResponse({
                "status": "error",
                "message": "Une erreur interne est survenue. Nos équipes ont été notifiées."
            }, status=500)
            
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)


# 3. Inscription à la newsletter
@csrf_exempt
def enregistrer_newsletter(request):
    if request.method == 'POST':
        try:
            try:
                donnees = json.loads(request.body)
            except json.JSONDecodeError:
                 return JsonResponse({"status": "error", "message": "JSON invalide"}, status=400)

            email = donnees.get('email', '').strip()
            
            if not email:
                return JsonResponse({
                    "status": "error",
                    "message": "L'adresse email est requise."
                }, status=400)
            
            if Newsletter.objects.filter(email=email).exists():
                return JsonResponse({
                    "status": "warning",
                    "message": "Vous êtes déjà inscrit à notre newsletter."
                }, status=200)
            
            Newsletter.objects.create(email=email)
            logger.info(f"NEWSLETTER: Nouvelle inscription {email}")
            
            return JsonResponse({
                "status": "success",
                "message": "Inscription réussie ! Merci."
            }, status=201)
            
        except Exception as e:
            logger.error(f"ERREUR NEWSLETTER: {str(e)}")
            return JsonResponse({
                "status": "error",
                "message": "Erreur lors de l'inscription."
            }, status=400)
    
    return JsonResponse({"message": "Méthode non autorisée"}, status=405)
