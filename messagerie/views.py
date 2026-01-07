from django.shortcuts import render
from django.http import JsonResponse
from .models import MessageContact, Newsletter
from django.core.mail import EmailMessage, send_mail
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

# 2. Reçoit, Stocke les informations et envoie un Email
# 2. Reçoit, Stocke les informations et envoie un Email
@csrf_exempt
def enregistrer_message(request):
    if request.method == 'POST':
        try:
            donnees = json.loads(request.body)
            
            # 1. Sauvegarde en Base de données (Priorité 1)
            nouveau_message = MessageContact.objects.create(
                nom=donnees.get('nom'),
                email=donnees.get('email'),
                sujet=donnees.get('sujet'),
                motif=donnees.get('motif'),
                message=donnees.get('message')
            )
            
            # 2. Préparation de l'email
            sujet_email = f"Nouveau message de {donnees.get('nom')} - {donnees.get('motif')}"
            message_email = f"""
            Bonjour Zenon,
            
            Tu as reçu un nouveau message depuis le site de l'ASBL :
            
            De : {donnees.get('nom')} ({donnees.get('email')})
            Motif : {donnees.get('motif')}
            Sujet : {donnees.get('sujet')}
            
            Message :
            {donnees.get('message')}
            
            --------------------------------------------------
            Ce message a aussi été enregistré dans ton Admin Django.
            """

            # 3. Envoi au Gmail (On utilise try/except pour ne pas faire planter le site si Gmail refuse)
            try:
                send_mail(
                    sujet_email,
                    message_email,
                    settings.EMAIL_HOST_USER,      # Expéditeur (Toi)
                    ['uzimamzenon@gmail.com'],    # Destinataire (Toi)
                    fail_silently=False,
                )
            except Exception as e_mail:
                print(f"Erreur d'envoi d'email : {e_mail}")
                # Le mail a échoué mais la DB est sauvée, on continue.

            return JsonResponse({"status": "success", "message": "Enregistré et mail envoyé !"}, status=201)

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)}, status=400)
            
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
