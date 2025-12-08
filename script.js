// Custom Alert Function
function showAlert(message, type = 'info') {
    // Remove existing alert if any
    const existingAlert = document.querySelector('.alert-overlay');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Determine alert type based on message content if not specified
    if (type === 'info') {
        if (message.includes('thành công') || message.includes('Cảm ơn')) {
            type = 'success';
        } else if (message.includes('lỗi') || message.includes('Lỗi') || message.includes('không thể')) {
            type = 'error';
        }
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'alert-modal';
    
    // Create header with icon
    const header = document.createElement('div');
    header.className = 'alert-header';
    
    const icon = document.createElement('div');
    icon.className = `alert-icon ${type}`;
    if (type === 'success') {
        icon.innerHTML = '✓';
    } else if (type === 'error') {
        icon.innerHTML = '✕';
    } else {
        icon.innerHTML = 'ℹ';
    }
    
    const title = document.createElement('h3');
    title.className = 'alert-title';
    if (type === 'success') {
        title.textContent = 'Thành công';
    } else if (type === 'error') {
        title.textContent = 'Lỗi';
    } else {
        title.textContent = 'Thông báo';
    }
    
    header.appendChild(icon);
    header.appendChild(title);
    
    // Create body
    const body = document.createElement('div');
    body.className = 'alert-body';
    body.textContent = message;
    
    // Create footer with button
    const footer = document.createElement('div');
    footer.className = 'alert-footer';
    
    const btn = document.createElement('button');
    btn.className = 'alert-btn alert-btn-primary';
    btn.textContent = 'OK';
    btn.onclick = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        modal.style.animation = 'slideDown 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
    };
    
    footer.appendChild(btn);
    
    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    
    // Assemble overlay
    overlay.appendChild(modal);
    
    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            btn.click();
        }
    };
    
    // Add to body
    document.body.appendChild(overlay);
    
    // Focus button for accessibility
    setTimeout(() => btn.focus(), 100);
}

// Get current location using Geolocation API
function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        const addressInput = document.getElementById('address');
        const locationStatus = document.getElementById('locationStatus');
        const latitudeInput = document.getElementById('latitude');
        const longitudeInput = document.getElementById('longitude');

        // Check if geolocation is supported
        if (!navigator.geolocation) {
            const errorMsg = 'Trình duyệt của bạn không hỗ trợ định vị GPS';
            locationStatus.innerHTML = '<span class="error">' + errorMsg + '</span>';
            locationStatus.style.display = 'block';
            locationStatus.className = 'location-status error';
            reject(new Error(errorMsg));
            return;
        }

        // Show loading state
        locationStatus.innerHTML = '<span class="loading">📍 Đang lấy vị trí của bạn...</span>';
        locationStatus.style.display = 'block';
        locationStatus.className = 'location-status loading';

        // Request location
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Update hidden inputs
                latitudeInput.value = lat;
                longitudeInput.value = lng;

                // Try to get address from coordinates (reverse geocoding)
                try {
                    const address = await reverseGeocode(lat, lng);
                    addressInput.value = address;
                    locationStatus.innerHTML = '<span class="success">✓ Đã lấy vị trí thành công</span>';
                    locationStatus.className = 'location-status success';
                    resolve({ latitude: lat, longitude: lng, address: address });
                } catch (error) {
                    // If reverse geocoding fails, use coordinates
                    const coordAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    addressInput.value = coordAddress;
                    locationStatus.innerHTML = '<span class="success">✓ Đã lấy tọa độ thành công</span>';
                    locationStatus.className = 'location-status success';
                    resolve({ latitude: lat, longitude: lng, address: coordAddress });
                }
            },
            (error) => {
                // Handle errors
                let errorMessage = 'Không thể lấy vị trí. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép trong cài đặt trình duyệt.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Thông tin vị trí không khả dụng.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Yêu cầu lấy vị trí đã hết thời gian chờ.';
                        break;
                    default:
                        errorMessage += 'Đã xảy ra lỗi không xác định.';
                        break;
                }
                
                locationStatus.innerHTML = '<span class="error">' + errorMessage + '</span>';
                locationStatus.className = 'location-status error';
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });
}

// Reverse geocoding to get address from coordinates
async function reverseGeocode(lat, lng) {
    try {
        // Using OpenStreetMap Nominatim API (free, no API key required)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'RescueApp/1.0'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }
        
        const data = await response.json();
        
        if (data && data.address) {
            const addr = data.address;
            // Build address string
            const addressParts = [];
            
            if (addr.house_number) addressParts.push(addr.house_number);
            if (addr.road) addressParts.push(addr.road);
            if (addr.suburb || addr.neighbourhood) addressParts.push(addr.suburb || addr.neighbourhood);
            if (addr.city || addr.town || addr.village) addressParts.push(addr.city || addr.town || addr.village);
            if (addr.state) addressParts.push(addr.state);
            
            return addressParts.length > 0 
                ? addressParts.join(', ') 
                : data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
        
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        // Return coordinates as fallback
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
}

// API Configuration
const API_BASE_URL = 'https://lthaibinh-rescue.hf.space';

// Form Submission
async function submitForm(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    const locationStatus = document.getElementById('locationStatus');
    
    // Disable submit button and show loading
    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang lấy vị trí...';
    
    try {
        // Get location first
        const location = await getCurrentLocation();
        
        // Update button text
        submitBtn.textContent = 'Đang gửi...';
        
        // Prepare form data according to API requirements
        const formData = {
            phone: document.getElementById('phone').value.trim(),
            message: document.getElementById('message').value.trim(),
            lat: location.latitude,
            lng: location.longitude
        };
        
        // Call API
        const response = await fetch(`${API_BASE_URL}/api/report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.ok) {
            // Handle API error
            const errorMessage = result.error || 'Đã xảy ra lỗi khi gửi yêu cầu';
            throw new Error(errorMessage);
        }
        
        // Show success message with location info
        showAlert(`Cảm ơn bạn! Yêu cầu của bạn đã được gửi thành công.\n\nVị trí: ${location.address}\nTọa độ: ${location.latitude}, ${location.longitude}\n\nChúng tôi sẽ liên hệ với bạn sớm nhất có thể.`, 'success');
        
        // Reset form
        event.target.reset();
        
        // Reset location status
        locationStatus.style.display = 'none';
        locationStatus.className = 'location-status';
        
    } catch (error) {
        // Handle errors
        let errorMessage = 'Không thể gửi yêu cầu. ';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.';
        } else if (error.message) {
            errorMessage += error.message;
        } else {
            errorMessage += 'Vui lòng thử lại sau.';
        }
        
        showAlert(errorMessage, 'error');
        
        // Show error in location status if location failed
        if (error.message && error.message.includes('vị trí')) {
            locationStatus.innerHTML = '<span class="error">' + error.message + '</span>';
            locationStatus.style.display = 'block';
            locationStatus.className = 'location-status error';
        }
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

