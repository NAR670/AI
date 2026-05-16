// ==================== State Management ====================
const state = {
    currentStep: 1,
    currentPage: 'home',
    images: {
        front: null,
        right: null,
        left: null
    },
    uploadedImages: {
        front: false,
        right: false,
        left: false
    },
    requestText: ''
};

// ==================== DOM Elements ====================
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.nav-link');
const steps = document.querySelectorAll('.step');
const statusMessage = document.getElementById('statusMessage');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');
const successMessage = document.getElementById('successMessage');
const cameraInput = document.getElementById('cameraInput');
const requestText = document.getElementById('requestText');
const charCount = document.getElementById('charCount');
const uploadProgress = document.getElementById('uploadProgress');

// Buttons
const startBtn = document.getElementById('startBtn');
const capture1Btn = document.getElementById('capture1Btn');
const capture2Btn = document.getElementById('capture2Btn');
const capture3Btn = document.getElementById('capture3Btn');
const submitBtn = document.getElementById('submitBtn');
const backStep2Btn = document.getElementById('backStep2Btn');
const backStep3Btn = document.getElementById('backStep3Btn');
const backStep4Btn = document.getElementById('backStep4Btn');
const restartBtn = document.getElementById('restartBtn');

// Preview Images
const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const preview3 = document.getElementById('preview3');

// Progress
const progressSteps = {
    1: document.getElementById('step1-progress'),
    2: document.getElementById('step2-progress'),
    3: document.getElementById('step3-progress'),
    4: document.getElementById('step4-progress')
};

// ==================== Utility Functions ====================
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message active ${type}`;
    setTimeout(() => {
        statusMessage.classList.remove('active');
    }, 5000);
}

function showLoading(show = true, text = 'جاري معالجة طلبك، يرجى الانتظار...') {
    if (show) {
        loading.classList.add('active');
        loadingText.textContent = text;
    } else {
        loading.classList.remove('active');
    }
}

function goToStep(stepNumber) {
    steps.forEach(step => step.style.display = 'none');
    document.getElementById(`step${stepNumber}`).style.display = 'block';
    
    // Update progress
    Object.keys(progressSteps).forEach(step => {
        progressSteps[step].classList.remove('completed', 'active');
        if (step < stepNumber) {
            progressSteps[step].classList.add('completed');
        } else if (step == stepNumber) {
            progressSteps[step].classList.add('active');
        }
    });

    state.currentStep = stepNumber;
    window.scrollTo(0, 0);
}

function goToPage(pageName) {
    // Hide all pages
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    document.getElementById(`${pageName}-page`).classList.add('active');
    
    // Update nav links
    navLinks.forEach(link => {
        if (link.dataset.page === pageName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    state.currentPage = pageName;
    window.scrollTo(0, 0);
}

function uploadImageToServer(imageFile, imageType) {
    const formData = new FormData();
    formData.append('image', imageFile, `${imageType}.png`);
    formData.append('type', imageType);

    fetch('/upload-image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            state.uploadedImages[imageType] = true;
            console.log(`تم إرسال صورة ${imageType} بنجاح`);
        }
    })
    .catch(error => console.error('خطأ في الإرسال:', error));
}

function captureImage(stepNumber) {
    cameraInput.click();
    cameraInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageData = event.target.result;
                
                if (stepNumber === 1) {
                    state.images.front = file;
                    preview1.src = imageData;
                    uploadImageToServer(file, 'front');
                    showStatus('تم التقاط الصورة الأمامية ✓', 'success');
                    setTimeout(() => goToStep(2), 3000);
                } else if (stepNumber === 2) {
                    state.images.right = file;
                    preview2.src = imageData;
                    uploadImageToServer(file, 'right');
                    showStatus('تم التقاط صورة جانب يمين ✓', 'success');
                    setTimeout(() => goToStep(3), 3000);
                } else if (stepNumber === 3) {
                    state.images.left = file;
                    preview3.src = imageData;
                    uploadImageToServer(file, 'left');
                    showStatus('تم التقاط صورة جانب يسار ✓', 'success');
                    setTimeout(() => goToStep(4), 3000);
                }
            };
            reader.readAsDataURL(file);
        }
    };
}

// ==================== Event Listeners ====================

// Navigation Links
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageName = link.dataset.page;
        goToPage(pageName);
    });
});

// Start Button
startBtn.addEventListener('click', () => {
    goToPage('home');
    uploadProgress.style.display = 'flex';
    steps.forEach(step => step.style.display = 'none');
    document.getElementById('step1').style.display = 'block';
    goToStep(1);
});

// Capture Buttons
capture1Btn.addEventListener('click', () => captureImage(1));
capture2Btn.addEventListener('click', () => captureImage(2));
capture3Btn.addEventListener('click', () => captureImage(3));

// Back Buttons
backStep2Btn.addEventListener('click', () => goToStep(1));
backStep3Btn.addEventListener('click', () => goToStep(2));
backStep4Btn.addEventListener('click', () => goToStep(3));

// Character Count
requestText.addEventListener('input', (e) => {
    const count = e.target.value.length;
    charCount.textContent = count;
    if (count > 500) {
        requestText.value = requestText.value.substring(0, 500);
        charCount.textContent = '500';
    }
});

// Submit Button
submitBtn.addEventListener('click', async () => {
    const description = requestText.value.trim();
    if (!description) {
        showStatus('يرجى كتابة وصف لطلبك', 'error');
        return;
    }

    showLoading(true, 'جاري إرسال طلبك النهائي...');
    submitBtn.disabled = true;

    try {
        const response = await fetch('/upload-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                request: description
            })
        });

        if (response.ok) {
            showLoading(false);
            steps.forEach(step => step.style.display = 'none');
            successMessage.style.display = 'block';
            
            setTimeout(() => {
                // Reset after 3 seconds
                state.images = { front: null, right: null, left: null };
                state.uploadedImages = { front: false, right: false, left: false };
                requestText.value = '';
                charCount.textContent = '0';
                preview1.src = '';
                preview2.src = '';
                preview3.src = '';
                successMessage.style.display = 'none';
                uploadProgress.style.display = 'none';
                goToPage('home');
                submitBtn.disabled = false;
            }, 15000);
        } else {
            throw new Error('فشل إرسال الطلب');
        }
    } catch (error) {
        console.error('خطأ:', error);
        showLoading(false);
        showStatus('حدث خطأ أثناء إرسال طلبك. يرجى المحاولة مرة أخرى.', 'error');
        submitBtn.disabled = false;
    }
});

// Restart Button
restartBtn.addEventListener('click', () => {
    successMessage.style.display = 'none';
    uploadProgress.style.display = 'none';
    steps.forEach(step => step.style.display = 'none');
    goToPage('home');
});
