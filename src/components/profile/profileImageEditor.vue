<template>
  <div class="profile-image-upload">
    <!-- Preview da imagem atual -->
    <div class="image-preview-container">
      <div class="image-preview" @click="triggerFileInput">
        <img 
          v-if="previewUrl" 
          :src="previewUrl" 
          alt="Preview da imagem de perfil"
          class="preview-image"
        />
        <div v-else class="placeholder">
          <svg class="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <span>Clique para adicionar foto</span>
        </div>
        
        <!-- Overlay de loading -->
        <div v-if="isUploading" class="loading-overlay">
          <div class="spinner"></div>
        </div>
      </div>
    </div>

    <!-- Input de arquivo (hidden) -->
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/jpg,image/png"
      @change="handleFileSelect"
      style="display: none"
    />

    <!-- Modal do Cropper -->
    <div v-if="showCropper" class="cropper-modal">
      <div class="cropper-container">
        <div class="cropper-header">
          <h3>Ajustar Imagem</h3>
          <button @click="closeCropper" class="close-btn">&times;</button>
        </div>
        
        <div class="cropper-body">
          <div class="cropper-canvas-container" ref="cropperContainer">
            <img 
              ref="cropperImage" 
              :src="originalImageUrl"
              @load="initializeCropper"
              style="max-width: 100%; display: block;"
            />
            <div 
              v-if="cropperReady"
              class="crop-box"
              :style="cropBoxStyle"
              @mousedown="startDrag"
              @touchstart="startDrag"
            >
              <div class="resize-handle nw" @mousedown.stop="startResize('nw', $event)" @touchstart.stop="startResize('nw', $event)"></div>
              <div class="resize-handle ne" @mousedown.stop="startResize('ne', $event)" @touchstart.stop="startResize('ne', $event)"></div>
              <div class="resize-handle sw" @mousedown.stop="startResize('sw', $event)" @touchstart.stop="startResize('sw', $event)"></div>
              <div class="resize-handle se" @mousedown.stop="startResize('se', $event)" @touchstart.stop="startResize('se', $event)"></div>
            </div>
          </div>
          
          <div class="cropper-controls">
            <div class="zoom-controls">
              <label>Zoom:</label>
              <input 
                type="range" 
                min="0.5" 
                max="3" 
                step="0.1" 
                v-model="zoomLevel"
                @input="updateZoom"
              />
              <span>{{ Math.round(zoomLevel * 100) }}%</span>
            </div>
            
            <div class="rotate-controls">
              <button @click="rotate(-90)" class="rotate-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M4 12a8 8 0 0 1 8-8V2.5L16 6l-4 3.5V8a6 6 0 1 0 6 6h1.5"/>
                </svg>
              </button>
              <button @click="rotate(90)" class="rotate-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 12a8 8 0 0 0-8-8V2.5L8 6l4 3.5V8a6 6 0 1 1-6 6H4.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div class="cropper-footer">
          <button @click="closeCropper" class="btn btn-secondary">Cancelar</button>
          <button @click="applyCrop" class="btn btn-primary">Aplicar</button>
        </div>
      </div>
    </div>

    <!-- Botões de ação -->
    <div class="actions" v-if="selectedFile">
      <button 
        @click="uploadImage" 
        :disabled="isUploading"
        class="btn btn-primary"
      >
        {{ isUploading ? 'Enviando...' : 'Salvar Imagem' }}
      </button>
      <button 
        @click="cancelSelection" 
        :disabled="isUploading"
        class="btn btn-secondary"
      >
        Cancelar
      </button>
    </div>

    <!-- Mensagem de erro -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Mensagem de sucesso -->
    <div v-if="successMessage" class="success-message">
      {{ successMessage }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, reactive, nextTick } from 'vue'
import { useProfileImage } from '@/stores/useProfileImage'

export default {
  name: 'ProfileImageUpload',
  props: {
    userId: {
      type: Number,
      required: true
    },
    size: {
      type: String,
      default: 'medium', // small, medium, large
      validator: value => ['small', 'medium', 'large'].includes(value)
    }
  },
  emits: ['upload-success', 'upload-error'],
  setup(props, { emit }) {
    const profileImageStore = useProfileImage()
    
    // Estado reativo
    const fileInput = ref(null)
    const selectedFile = ref(null)
    const previewUrl = ref(null)
    const isUploading = ref(false)
    const errorMessage = ref('')
    const successMessage = ref('')

    // Estado do cropper
    const showCropper = ref(false)
    const originalImageUrl = ref('')
    const cropperImage = ref(null)
    const cropperContainer = ref(null)
    const cropperReady = ref(false)
    const zoomLevel = ref(1)
    const rotation = ref(0)
    
    // Estado da caixa de crop
    const cropBox = reactive({
      x: 0,
      y: 0,
      width: 200,
      height: 200
    })
    
    // Estado do drag
    const dragState = reactive({
      isDragging: false,
      isResizing: false,
      startX: 0,
      startY: 0,
      startBoxX: 0,
      startBoxY: 0,
      startBoxWidth: 0,
      startBoxHeight: 0,
      resizeHandle: null
    })

    // Computed para verificar se está carregando
    const isLoading = computed(() => {
      return profileImageStore.isImageLoading(props.userId)
    })

    // Computed para o estilo da caixa de crop
    const cropBoxStyle = computed(() => ({
      left: `${cropBox.x}px`,
      top: `${cropBox.y}px`,
      width: `${cropBox.width}px`,
      height: `${cropBox.height}px`,
      transform: `scale(${zoomLevel.value})`
    }))

    // Carregar imagem existente ao montar o componente
    onMounted(async () => {
      try {
        const existingUrl = await profileImageStore.getProfileImage(props.userId)
        if (existingUrl) {
          previewUrl.value = existingUrl
        }
      } catch (error) {
        console.log('Nenhuma imagem de perfil encontrada')
      }
      
      // Adicionar listeners globais para drag
      document.addEventListener('mousemove', handleDrag)
      document.addEventListener('mouseup', stopDrag)
      document.addEventListener('touchmove', handleDrag)
      document.addEventListener('touchend', stopDrag)
    })

    // Cleanup dos listeners
    onUnmounted(() => {
      document.removeEventListener('mousemove', handleDrag)
      document.removeEventListener('mouseup', stopDrag)
      document.removeEventListener('touchmove', handleDrag)
      document.removeEventListener('touchend', stopDrag)
    })

    // Métodos
    const triggerFileInput = () => {
      if (!isUploading.value) {
        fileInput.value?.click()
      }
    }

    const handleFileSelect = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      clearMessages()

      try {
        // Validar formato do arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
        const allowedExtensions = ['.jpg', '.jpeg', '.png']
        const fileName = file.name.toLowerCase()
        
        const hasValidType = allowedTypes.includes(file.type)
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
        
        if (!hasValidType || !hasValidExtension) {
          throw new Error('Formato de arquivo não permitido. Apenas JPG e PNG são aceitos.')
        }

        // Validar tamanho
        const maxSize = 5 * 1024 * 1024 // 5MB
        if (file.size > maxSize) {
          throw new Error('Arquivo muito grande. Tamanho máximo permitido: 5MB')
        }

        selectedFile.value = file

        // Criar preview e abrir cropper
        const preview = await createImagePreview(file)
        originalImageUrl.value = preview
        showCropper.value = true

      } catch (error) {
        errorMessage.value = error.message
        resetFileInput()
      }
    }

    // Métodos do Cropper
    const initializeCropper = async () => {
      await nextTick()
      
      if (!cropperImage.value || !cropperContainer.value) return
      
      const img = cropperImage.value
      const container = cropperContainer.value
      
      // Centralizar a caixa de crop
      const containerRect = container.getBoundingClientRect()
      const imgRect = img.getBoundingClientRect()
      
      const size = Math.min(imgRect.width, imgRect.height) * 0.8
      
      cropBox.x = (imgRect.width - size) / 2
      cropBox.y = (imgRect.height - size) / 2
      cropBox.width = size
      cropBox.height = size
      
      cropperReady.value = true
    }

    const startDrag = (event) => {
      event.preventDefault()
      
      const e = event.touches ? event.touches[0] : event
      
      dragState.isDragging = true
      dragState.startX = e.clientX
      dragState.startY = e.clientY
      dragState.startBoxX = cropBox.x
      dragState.startBoxY = cropBox.y
    }

    const startResize = (handle, event) => {
      event.preventDefault()
      
      const e = event.touches ? event.touches[0] : event
      
      dragState.isResizing = true
      dragState.resizeHandle = handle
      dragState.startX = e.clientX
      dragState.startY = e.clientY
      dragState.startBoxX = cropBox.x
      dragState.startBoxY = cropBox.y
      dragState.startBoxWidth = cropBox.width
      dragState.startBoxHeight = cropBox.height
    }

    const handleDrag = (event) => {
      if (!dragState.isDragging && !dragState.isResizing) return
      
      const e = event.touches ? event.touches[0] : event
      const deltaX = e.clientX - dragState.startX
      const deltaY = e.clientY - dragState.startY
      
      if (dragState.isDragging) {
        // Mover a caixa
        cropBox.x = Math.max(0, Math.min(dragState.startBoxX + deltaX, cropperImage.value.width - cropBox.width))
        cropBox.y = Math.max(0, Math.min(dragState.startBoxY + deltaY, cropperImage.value.height - cropBox.height))
      } else if (dragState.isResizing) {
        // Redimensionar a caixa
        const minSize = 50
        
        switch (dragState.resizeHandle) {
          case 'nw':
            cropBox.x = Math.max(0, dragState.startBoxX + deltaX)
            cropBox.y = Math.max(0, dragState.startBoxY + deltaY)
            cropBox.width = Math.max(minSize, dragState.startBoxWidth - deltaX)
            cropBox.height = Math.max(minSize, dragState.startBoxHeight - deltaY)
            break
          case 'ne':
            cropBox.y = Math.max(0, dragState.startBoxY + deltaY)
            cropBox.width = Math.max(minSize, dragState.startBoxWidth + deltaX)
            cropBox.height = Math.max(minSize, dragState.startBoxHeight - deltaY)
            break
          case 'sw':
            cropBox.x = Math.max(0, dragState.startBoxX + deltaX)
            cropBox.width = Math.max(minSize, dragState.startBoxWidth - deltaX)
            cropBox.height = Math.max(minSize, dragState.startBoxHeight + deltaY)
            break
          case 'se':
            cropBox.width = Math.max(minSize, dragState.startBoxWidth + deltaX)
            cropBox.height = Math.max(minSize, dragState.startBoxHeight + deltaY)
            break
        }
      }
    }

    const stopDrag = () => {
      dragState.isDragging = false
      dragState.isResizing = false
      dragState.resizeHandle = null
    }

    const updateZoom = () => {
      // O zoom é aplicado através do computed style
    }

    const rotate = (degrees) => {
      rotation.value = (rotation.value + degrees) % 360
      
      if (cropperImage.value) {
        cropperImage.value.style.transform = `rotate(${rotation.value}deg)`
      }
    }

    const applyCrop = async () => {
      try {
        // Criar canvas para aplicar o crop
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Definir tamanho do canvas (quadrado)
        const outputSize = 400
        canvas.width = outputSize
        canvas.height = outputSize
        
        // Criar nova imagem para desenhar
        const img = new Image()
        img.src = originalImageUrl.value
        
        await new Promise((resolve) => {
          img.onload = resolve
        })
        
        // Aplicar transformações
        ctx.save()
        
        // Calcular dimensões considerando zoom
        const sourceX = cropBox.x / zoomLevel.value
        const sourceY = cropBox.y / zoomLevel.value
        const sourceWidth = cropBox.width / zoomLevel.value
        const sourceHeight = cropBox.height / zoomLevel.value
        
        // Aplicar rotação se necessário
        if (rotation.value !== 0) {
          ctx.translate(outputSize / 2, outputSize / 2)
          ctx.rotate((rotation.value * Math.PI) / 180)
          ctx.translate(-outputSize / 2, -outputSize / 2)
        }
        
        // Desenhar a imagem cortada
        ctx.drawImage(
          img,
          sourceX, sourceY, sourceWidth, sourceHeight,
          0, 0, outputSize, outputSize
        )
        
        ctx.restore()
        
        // Converter para blob
        canvas.toBlob(async (blob) => {
          // Criar novo arquivo com a imagem cortada
          const croppedFile = new File([blob], selectedFile.value.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })
          
          selectedFile.value = croppedFile
          
          // Criar preview
          previewUrl.value = canvas.toDataURL('image/jpeg')
          
          // Fechar cropper
          closeCropper()
        }, 'image/jpeg', 0.9)
        
      } catch (error) {
        errorMessage.value = 'Erro ao processar imagem'
        console.error(error)
      }
    }

    const closeCropper = () => {
      showCropper.value = false
      cropperReady.value = false
      rotation.value = 0
      zoomLevel.value = 1
      
      if (!selectedFile.value) {
        resetFileInput()
      }
    }

    const uploadImage = async () => {
      if (!selectedFile.value) return

      isUploading.value = true
      clearMessages()

      try {
        const response = await profileImageStore.uploadProfileImage(
          selectedFile.value, 
          props.userId
        )

        successMessage.value = 'Imagem enviada com sucesso!'
        
        // Emitir evento de sucesso
        emit('upload-success', response)

        // Limpar seleção
        selectedFile.value = null
        resetFileInput()

        // Limpar mensagem de sucesso após alguns segundos
        setTimeout(() => {
          successMessage.value = ''
        }, 3000)

      } catch (error) {
        errorMessage.value = error.message
        emit('upload-error', error)
      } finally {
        isUploading.value = false
      }
    }

    const cancelSelection = () => {
      selectedFile.value = null
      resetFileInput()
      clearMessages()
      
      // Restaurar preview original se existir
      loadExistingImage()
    }

    const loadExistingImage = async () => {
      try {
        const existingUrl = profileImageStore.getProfileImageUrl(props.userId)
        if (existingUrl) {
          previewUrl.value = existingUrl
        } else {
          previewUrl.value = null
        }
      } catch (error) {
        previewUrl.value = null
      }
    }

    const resetFileInput = () => {
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const clearMessages = () => {
      errorMessage.value = ''
      successMessage.value = ''
    }

    // Função auxiliar para criar preview de imagem
    const createImagePreview = (file) => {
      return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
          reject(new Error('Arquivo deve ser uma imagem'))
          return
        }

        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
        reader.readAsDataURL(file)
      })
    }

    return {
      fileInput,
      selectedFile,
      previewUrl,
      isUploading,
      isLoading,
      errorMessage,
      successMessage,
      showCropper,
      originalImageUrl,
      cropperImage,
      cropperContainer,
      cropperReady,
      zoomLevel,
      rotation,
      cropBoxStyle,
      triggerFileInput,
      handleFileSelect,
      uploadImage,
      cancelSelection,
      initializeCropper,
      startDrag,
      startResize,
      updateZoom,
      rotate,
      applyCrop,
      closeCropper
    }
  }
}
</script>

<style scoped>
.profile-image-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.image-preview-container {
  position: relative;
}

.image-preview {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  border: 3px dashed #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #f9f9f9;
}

.image-preview:hover {
  border-color: #007bff;
  background-color: #f0f8ff;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  text-align: center;
  padding: 1rem;
}

.camera-icon {
  width: 2rem;
  height: 2rem;
  color: #999;
}

.placeholder span {
  font-size: 0.875rem;
  font-weight: 500;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal do Cropper */
.cropper-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.cropper-container {
  background: white;
  border-radius: 0.5rem;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cropper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.cropper-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #000;
}

.cropper-body {
  flex: 1;
  overflow: auto;
  padding: 1rem;
}

.cropper-canvas-container {
  position: relative;
  display: inline-block;
  margin: 0 auto;
  background: #f0f0f0;
  overflow: hidden;
}

.crop-box {
  position: absolute;
  border: 2px solid #007bff;
  background: rgba(0, 123, 255, 0.1);
  cursor: move;
  transition: transform 0.2s;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  background: #007bff;
  border: 2px solid white;
  border-radius: 50%;
}

.resize-handle.nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-handle.ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-handle.sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-handle.se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

.cropper-controls {
  margin-top: 1rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.zoom-controls label {
  font-weight: 500;
  font-size: 0.875rem;
}

.zoom-controls input[type="range"] {
  width: 120px;
}

.zoom-controls span {
  font-size: 0.875rem;
  min-width: 40px;
}

.rotate-controls {
  display: flex;
  gap: 0.5rem;
}

.rotate-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rotate-btn:hover {
  background: #e0e0e0;
}

.rotate-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.cropper-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}

/* Botões de ação */
.actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 0.375rem;
  max-width: 300px;
}

.success-message {
  color: #155724;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 0.375rem;
  max-width: 300px;
}

/* Variações de tamanho */
.profile-image-upload[data-size="small"] .image-preview {
  width: 100px;
  height: 100px;
}

.profile-image-upload[data-size="large"] .image-preview {
  width: 200px;
  height: 200px;
}

/* Responsividade */
@media (max-width: 640px) {
  .cropper-container {
    max-width: 95%;
    max-height: 85vh;
  }
  
  .cropper-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .cropper-footer {
    justify-content: center;
  }
}
</style>