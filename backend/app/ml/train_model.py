# -*- coding: utf-8 -*-
"""
Script d'entrainement du modele CNN pour la classification de pieces
A lancer une fois pour creer le modele, ou sur Google Colab
"""
import os
import numpy as np
from PIL import Image

def create_model():
    """Cree un modele CNN simple mais efficace"""
    import tensorflow as tf
    
    model = tf.keras.Sequential([
        # Bloc 1
        tf.keras.layers.Conv2D(32, (3,3), activation='relu', padding='same', input_shape=(224, 224, 3)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Dropout(0.25),
        
        # Bloc 2
        tf.keras.layers.Conv2D(64, (3,3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Dropout(0.25),
        
        # Bloc 3
        tf.keras.layers.Conv2D(128, (3,3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.MaxPooling2D(2,2),
        tf.keras.layers.Dropout(0.3),
        
        # Bloc 4
        tf.keras.layers.Conv2D(256, (3,3), activation='relu', padding='same'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dropout(0.4),
        
        # Dense
        tf.keras.layers.Dense(256, activation='relu'),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(10, activation='softmax')
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

def train_with_data_augmentation(model, X_train, y_train, X_val, y_val):
    """Entraine le modele avec data augmentation"""
    import tensorflow as tf
    
    datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rotation_range=30,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.3,
        horizontal_flip=True,
        brightness_range=[0.7, 1.3],
        fill_mode='nearest'
    )
    
    # Callbacks
    early_stop = tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=10, restore_best_weights=True)
    reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6)
    
    history = model.fit(
        datagen.flow(X_train, y_train, batch_size=32),
        validation_data=(X_val, y_val),
        epochs=50,
        callbacks=[early_stop, reduce_lr],
        verbose=1
    )
    
    return model, history

def generate_synthetic_data():
    """Genere des donnees synthetiques pour l'entrainement initial"""
    import tensorflow as tf
    
    num_samples = 200  # 200 images par classe
    num_classes = 10
    
    X = np.random.rand(num_samples * num_classes, 224, 224, 3).astype(np.float32)
    y = np.zeros((num_samples * num_classes, num_classes))
    
    for i in range(num_classes):
        y[i*num_samples:(i+1)*num_samples, i] = 1
    
    # Ajouter des motifs distincts par classe
    for i in range(num_classes):
        pattern = np.random.rand(224, 224, 3) * 0.5 + 0.25
        for j in range(num_samples):
            noise = np.random.randn(224, 224, 3) * 0.1
            X[i*num_samples + j] = np.clip(pattern + noise, 0, 1)
    
    # Split
    indices = np.random.permutation(len(X))
    split = int(0.8 * len(X))
    
    return (
        X[indices[:split]], y[indices[:split]],
        X[indices[split:]], y[indices[split:]]
    )

if __name__ == "__main__":
    print("🖥️ Creation du modele CNN...")
    model = create_model()
    model.summary()
    
    print("\n📊 Generation de donnees synthetiques...")
    X_train, y_train, X_val, y_val = generate_synthetic_data()
    
    print(f"   Train: {len(X_train)} images")
    print(f"   Val: {len(X_val)} images")
    
    print("\n🚀 Entrainement...")
    model, history = train_with_data_augmentation(model, X_train, y_train, X_val, y_val)
    
    # Sauvegarder
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'part_classifier.h5')
    model.save(model_path)
    print(f"\n✅ Modele sauvegarde: {model_path}")
