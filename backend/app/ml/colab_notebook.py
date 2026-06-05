# -*- coding: utf-8 -*-
"""
===== NOTEBOOK GOOGLE COLAB =====
Copie ce code dans un notebook Colab et execute cellule par cellule
"""

# CELLULE 1 : Installation et imports
!pip install tensorflow pillow numpy matplotlib scikit-learn

import os
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from google.colab import files, drive
import zipfile
import requests
from io import BytesIO

print("TensorFlow version:", tf.__version__)
print("GPU disponible:", tf.config.list_physical_devices('GPU'))

# CELLULE 2 : Classes de pieces
PART_CLASSES = [
    "ecran", "clavier", "carte_mere", "alimentation", 
    "disque_dur", "ventilateur", "carte_graphique", 
    "ram", "imprimante", "cable"
]
NUM_CLASSES = len(PART_CLASSES)
print(f"Nombre de classes: {NUM_CLASSES}")
for i, name in enumerate(PART_CLASSES):
    print(f"  {i}: {name}")

# CELLULE 3 : Uploader vos images
# Creez un dossier par classe avec vos images
print("""
📁 Structure attendue :
/content/dataset/
  ├── ecran/        (vos photos d'ecrans)
  ├── clavier/      (vos photos de claviers)
  ├── carte_mere/
  ├── alimentation/
  ├── disque_dur/
  ├── ventilateur/
  ├── carte_graphique/
  ├── ram/
  ├── imprimante/
  └── cable/

📤 Uploader un ZIP contenant ces dossiers :
""")

# Upload du ZIP
uploaded = files.upload()

# Extraire le ZIP
for filename in uploaded.keys():
    with zipfile.ZipFile(filename, 'r') as zip_ref:
        zip_ref.extractall('/content/dataset/')
    print(f"✅ {filename} extrait")

# CELLULE 4 : Charger et preparer les donnees
def load_images(data_dir, img_size=(224, 224)):
    """Charge les images depuis les dossiers de classe"""
    images = []
    labels = []
    
    for class_idx, class_name in enumerate(PART_CLASSES):
        class_dir = os.path.join(data_dir, class_name)
        if not os.path.exists(class_dir):
            print(f"⚠️ Dossier {class_name} introuvable, creation de donnees synthetiques...")
            # Creer des images synthetiques si pas de dossier
            for _ in range(50):  # 50 images synthetiques
                img = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
                # Ajouter un motif distinct par classe
                img[:, :, class_idx % 3] = np.clip(img[:, :, class_idx % 3] + 100, 0, 255)
                images.append(img)
                labels.append(class_idx)
            continue
        
        for filename in os.listdir(class_dir):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                img_path = os.path.join(class_dir, filename)
                try:
                    img = Image.open(img_path).convert('RGB')
                    img = img.resize(img_size)
                    img_array = np.array(img)
                    images.append(img_array)
                    labels.append(class_idx)
                except Exception as e:
                    print(f"Erreur {filename}: {e}")
        
        print(f"  {class_name}: {labels.count(class_idx)} images")
    
    return np.array(images), np.array(labels)

print("📂 Chargement des images...")
X, y = load_images('/content/dataset')

# Normaliser
X = X.astype('float32') / 255.0

# One-hot encoding
y_cat = keras.utils.to_categorical(y, NUM_CLASSES)

print(f"\n✅ Total: {len(X)} images")
print(f"   Shape: {X.shape}")

# CELLULE 5 : Data augmentation
datagen = keras.preprocessing.image.ImageDataGenerator(
    rotation_range=40,
    width_shift_range=0.3,
    height_shift_range=0.3,
    shear_range=0.3,
    zoom_range=0.4,
    horizontal_flip=True,
    vertical_flip=False,
    brightness_range=[0.6, 1.4],
    fill_mode='nearest'
)

# Split train/val
X_train, X_val, y_train, y_val = train_test_split(X, y_cat, test_size=0.2, random_state=42, stratify=y)

print(f"Train: {len(X_train)} images")
print(f"Val: {len(X_val)} images")

# CELLULE 6 : Creer le modele CNN
def create_model():
    model = keras.Sequential([
        # Bloc 1
        keras.layers.Conv2D(32, (3,3), activation='relu', padding='same', input_shape=(224, 224, 3)),
        keras.layers.BatchNormalization(),
        keras.layers.Conv2D(32, (3,3), activation='relu', padding='same'),
        keras.layers.MaxPooling2D(2,2),
        keras.layers.Dropout(0.3),
        
        # Bloc 2
        keras.layers.Conv2D(64, (3,3), activation='relu', padding='same'),
        keras.layers.BatchNormalization(),
        keras.layers.Conv2D(64, (3,3), activation='relu', padding='same'),
        keras.layers.MaxPooling2D(2,2),
        keras.layers.Dropout(0.3),
        
        # Bloc 3
        keras.layers.Conv2D(128, (3,3), activation='relu', padding='same'),
        keras.layers.BatchNormalization(),
        keras.layers.Conv2D(128, (3,3), activation='relu', padding='same'),
        keras.layers.MaxPooling2D(2,2),
        keras.layers.Dropout(0.4),
        
        # Bloc 4
        keras.layers.Conv2D(256, (3,3), activation='relu', padding='same'),
        keras.layers.BatchNormalization(),
        keras.layers.GlobalAveragePooling2D(),
        keras.layers.Dropout(0.5),
        
        # Dense
        keras.layers.Dense(512, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.5),
        keras.layers.Dense(256, activation='relu'),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(NUM_CLASSES, activation='softmax')
    ])
    
    return model

model = create_model()
model.summary()

# CELLULE 7 : Compiler et entrainer
model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=0.001),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Callbacks
callbacks = [
    keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=15, restore_best_weights=True, verbose=1),
    keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-7, verbose=1),
    keras.callbacks.ModelCheckpoint('best_model.h5', monitor='val_accuracy', save_best_only=True, verbose=1)
]

print("🚀 Debut de l'entrainement...")
history = model.fit(
    datagen.flow(X_train, y_train, batch_size=32),
    validation_data=(X_val, y_val),
    epochs=80,
    callbacks=callbacks,
    verbose=1
)

# CELLULE 8 : Visualiser les resultats
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

# Accuracy
ax1.plot(history.history['accuracy'], label='Train', color='#3b82f6')
ax1.plot(history.history['val_accuracy'], label='Val', color='#f59e0b')
ax1.set_title('Accuracy')
ax1.set_xlabel('Epochs')
ax1.set_ylabel('Accuracy')
ax1.legend()
ax1.grid(alpha=0.3)

# Loss
ax2.plot(history.history['loss'], label='Train', color='#3b82f6')
ax2.plot(history.history['val_loss'], label='Val', color='#f59e0b')
ax2.set_title('Loss')
ax2.set_xlabel('Epochs')
ax2.set_ylabel('Loss')
ax2.legend()
ax2.grid(alpha=0.3)

plt.tight_layout()
plt.show()

# CELLULE 9 : Matrice de confusion
from sklearn.metrics import confusion_matrix, classification_report
import seaborn as sns

# Predictions sur validation
y_pred = model.predict(X_val)
y_pred_classes = np.argmax(y_pred, axis=1)
y_true_classes = np.argmax(y_val, axis=1)

# Matrice de confusion
cm = confusion_matrix(y_true_classes, y_pred_classes)
plt.figure(figsize=(12, 10))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
            xticklabels=PART_CLASSES, yticklabels=PART_CLASSES)
plt.title('Matrice de confusion')
plt.xlabel('Prediction')
plt.ylabel('Verite')
plt.xticks(rotation=45, ha='right')
plt.yticks(rotation=0)
plt.tight_layout()
plt.show()

# Rapport
print("\n📊 Rapport de classification :")
print(classification_report(y_true_classes, y_pred_classes, target_names=PART_CLASSES))

# CELLULE 10 : Sauvegarder et telecharger le modele
# Sauvegarder en .h5
model.save('part_classifier.h5')
print("✅ Modele sauvegarde: part_classifier.h5")

# Sauvegarder en TensorFlow Lite (pour mobile)
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open('part_classifier.tflite', 'wb') as f:
    f.write(tflite_model)
print("✅ Modele TFLite sauvegarde: part_classifier.tflite")

# Telecharger
from google.colab import files
files.download('part_classifier.h5')
files.download('part_classifier.tflite')

print("\n🎉 Entrainement termine !")
print("📁 Telechargez part_classifier.h5 et placez-le dans backend/app/ml/models/")
print("📱 part_classifier.tflite peut etre utilise pour une app mobile")

# CELLULE 11 (OPTIONNEL) : Test sur une image
def predict_image(image_path):
    img = Image.open(image_path).convert('RGB')
    img = img.resize((224, 224))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    
    prediction = model.predict(img_array, verbose=0)[0]
    top3_idx = np.argsort(prediction)[-3:][::-1]
    
    print("🔍 Predictions :")
    for idx in top3_idx:
        print(f"  {PART_CLASSES[idx]}: {prediction[idx]*100:.1f}%")
    
    plt.imshow(img)
    plt.title(f"Prediction: {PART_CLASSES[top3_idx[0]]} ({prediction[top3_idx[0]]*100:.1f}%)")
    plt.axis('off')
    plt.show()

# Test
print("\n📤 Uploader une image a tester :")
test_img = files.upload()
for filename in test_img.keys():
    predict_image(filename)
