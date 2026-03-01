from django.shortcuts import render

def index(request):
    # สั่งให้เรนเดอร์ไฟล์ index.html จากโฟลเดอร์ templates
    return render(request, 'index.html')