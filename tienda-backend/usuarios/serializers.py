from rest_framework import serializers
from .models import Usuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['id', 'nombre', 'email', 'rol', 'activo', 'created_at']

class UsuarioCrearSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Usuario
        fields = ['id', 'nombre', 'email', 'password_hash', 'rol']

    def create(self, validated_data):
        import hashlib
        pwd = validated_data['password_hash']
        validated_data['password_hash'] = hashlib.sha256(pwd.encode()).hexdigest()
        return super().create(validated_data)