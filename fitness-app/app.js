// --- 1. การตั้งค่า Supabase Client ---
const SUPABASE_URL = 'https://rzjurhordpyictvxphnm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6anVyaG9yZHB5aWN0dnhwaG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDM0NjMsImV4cCI6MjA3NTMxOTQ2M30.cPYUpBy-QIJj6vW-0gv1kxvzHt8BMI3ll3WyaNh6aBI';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. LOGIC สำหรับแต่ละหน้า ---
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;

    if (currentPage.includes("signup.html")) {
        const signupForm = document.getElementById('signup-form');
        if (signupForm) signupForm.addEventListener('submit', handleSignup);
    } else if (currentPage.includes("login.html")) {
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.addEventListener('submit', handleLogin);
    } else if (currentPage.includes("home.html")) {
        handleHomePage();
    }
});

// --- ฟังก์ชันจัดการการ Signup ---
async function handleSignup(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    const { data, error } = await supabaseClient.auth.signUp({
        email, password, options: { data: { username } }
    });

    if (error) return alert("เกิดข้อผิดพลาดในการสมัคร: " + error.message);
    
    if (data.user) {
        const { error: insertError } = await supabaseClient.from('users').insert({ id: data.user.id, username });
        if (insertError) return alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + insertError.message);
        
        alert("สมัครสมาชิกสำเร็จ!");
        window.location.href = "home.html";
    }
}

// --- ฟังก์ชันจัดการการ Login ---
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง: " + error.message);
    window.location.href = "home.html";
}

// --- ฟังก์ชันสำหรับจัดการหน้า Home ทั้งหมด ---
async function handleHomePage() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        return window.location.href = "login.html";
    }
    const user = session.user;
    
    // ดึงข้อมูล User และตั้งค่า Event Listeners
    const { data, error } = await supabaseClient.from('users').select('*').eq('id', user.id).single();
    
    // --- จุดที่แก้ไข ---
    if (error || !data) {
        console.error("Error fetching user data:", error);
        alert("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองเข้าสู่ระบบใหม่อีกครั้ง");
        // ทำการ Sign out เพื่อป้องกันการค้างในระบบ
        await supabaseClient.auth.signOut();
        return window.location.href = "login.html";
    }

    populateUserInfo(data);
    setupEventListeners(user, data);
}

// --- ฟังก์ชันสำหรับแสดงผลข้อมูลผู้ใช้ ---
function populateUserInfo(userData) {
    // ... โค้ดในฟังก์ชันนี้เหมือนเดิมทุกประการ ...
    document.getElementById('username-display').textContent = userData.username || 'User';
    if (userData.profile_pic_url) document.getElementById('profile-pic').src = userData.profile_pic_url;
    document.getElementById('weight').value = userData.weight || '';
    document.getElementById('height').value = userData.height || '';
    document.getElementById('gender').value = userData.gender || 'male';
    document.getElementById('age').value = userData.age || '';
    
    if (userData.weight && userData.height && userData.age && userData.gender) {
        calculateAndDisplay(userData.weight, userData.height, userData.age, userData.gender);
    }
}

// --- ฟังก์ชันสำหรับตั้งค่า Event Listener ทั้งหมดในหน้า Home ---
function setupEventListeners(user, userData) {
    // ... โค้ดในฟังก์ชันนี้เหมือนเดิมทุกประการ ...
    let currentWeight = userData.weight;

    // ฟอร์มข้อมูลส่วนตัว
    document.getElementById('user-info-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const gender = document.getElementById('gender').value;
        const age = document.getElementById('age').value;
        if (weight && height && gender && age) {
            const { error } = await supabaseClient.from('users').update({ weight, height, gender, age }).eq('id', user.id);
            if (error) return alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
            
            currentWeight = parseFloat(weight);
            calculateAndDisplay(weight, height, age, gender);
            alert("บันทึกข้อมูลเรียบร้อย!");
        }
    });

    // ฟอร์มตั้งเป้าหมาย
    document.getElementById('goal-setter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const targetWeight = parseFloat(document.getElementById('target-weight').value);
        const targetDateStr = document.getElementById('target-date').value;
        const maintenanceCaloriesEl = document.getElementById('maintenance-calories-result');
        if (!maintenanceCaloriesEl) return;

        const maintenanceCalories = parseFloat(maintenanceCaloriesEl.textContent);
        if (!currentWeight || isNaN(maintenanceCalories)) return alert("กรุณากรอกข้อมูลส่วนตัวและกดบันทึกก่อนครับ");
        
        const targetDate = new Date(targetDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (targetDate <= today) return alert("กรุณาเลือกวันที่ในอนาคตครับ");

        const diffTime = Math.abs(targetDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weightDiff = targetWeight - currentWeight;
        const totalCalorieDiff = weightDiff * 7700;
        const dailyCalorieAdjust = totalCalorieDiff / diffDays;
        const goalCalories = Math.round(maintenanceCalories + dailyCalorieAdjust);

        const goalDisplay = document.getElementById('goal-calories-display');
        const goalResult = document.getElementById('goal-calories-result');
        const goalMessage = document.getElementById('goal-message');
        if (!goalDisplay || !goalResult || !goalMessage) return;

        goalResult.textContent = `${goalCalories} kcal`;
        let message = `เพื่อลดน้ำหนักให้ได้ ${Math.abs(weightDiff).toFixed(1)} kg ภายใน ${diffDays} วัน`;
        if (weightDiff > 0) message = `เพื่อเพิ่มน้ำหนักให้ได้ ${weightDiff.toFixed(1)} kg ภายใน ${diffDays} วัน`;
        goalMessage.textContent = message;
        if (Math.abs(dailyCalorieAdjust) > 1000) goalMessage.textContent += " (คำเตือน: เป้าหมายนี้อาจจะหนักเกินไป)";
        goalDisplay.style.display = 'block';
    });

    // อัปโหลดรูป
    document.getElementById('file-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabaseClient.storage.from('profile_pictures').upload(filePath, file);
        if (uploadError) return alert("เกิดข้อผิดพลาดในการอัปโหลดรูป: " + uploadError.message);

        const { data: urlData } = supabaseClient.storage.from('profile_pictures').getPublicUrl(filePath);
        document.getElementById('profile-pic').src = urlData.publicUrl;
        await supabaseClient.from('users').update({ profile_pic_url: urlData.publicUrl }).eq('id', user.id);
    });

    // ออกจากระบบ
    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
    });
}

// --- ฟังก์ชันสำหรับคำนวณ BMI และแคลอรี่พื้นฐาน ---
function calculateAndDisplay(weight, height, age, gender) {
    // ... โค้ดในฟังก์ชันนี้เหมือนเดิมทุกประการ ...
    const bmiResult = document.getElementById('bmi-result');
    const caloriesResult = document.getElementById('maintenance-calories-result');
    if (!bmiResult || !caloriesResult) return;
    
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    bmiResult.textContent = bmi;
    
    let bmr = (gender === 'male')
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    const dailyCalories = (bmr * 1.375).toFixed(0);
    caloriesResult.textContent = `${dailyCalories} kcal`;
}