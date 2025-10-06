// --- 1. การตั้งค่า Supabase Client ---
// เอา URL และ Anon Key ที่คัดลอกมาจากขั้นตอนที่ 1 มาวางตรงนี้
const SUPABASE_URL = 'https://rzjurhordpyictvxphnm.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6anVyaG9yZHB5aWN0dnhwaG5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NDM0NjMsImV4cCI6MjA3NTMxOTQ2M30.cPYUpBy-QIJj6vW-0gv1kxvzHt8BMI3ll3WyaNh6aBI';

// สร้าง client สำหรับเชื่อมต่อ Supabase (แก้ไขให้ถูกต้องแล้ว)
// เราจะเก็บ client ที่สร้างเสร็จแล้วไว้ในตัวแปรชื่อ supabaseClient
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- 2. LOGIC สำหรับแต่ละหน้า ---
// โค้ดส่วนนี้จะรอให้หน้าเว็บโหลดเสร็จก่อน แล้วค่อยเริ่มทำงาน
document.addEventListener('DOMContentLoaded', () => {

    // --- Logic สำหรับหน้า Signup ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('signup-username').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;

            // ใช้ supabaseClient ที่เราสร้างขึ้น
            const { data, error } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
                options: { data: { username: username } }
            });

            if (error) {
                alert("เกิดข้อผิดพลาดในการสมัคร: " + error.message);
            } else if (data.user) {
                // ใช้ supabaseClient ที่เราสร้างขึ้น
                const { error: insertError } = await supabaseClient.from('users').insert({ 
                    id: data.user.id,
                    username: username,
                });
                if (insertError) {
                    alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + insertError.message);
                } else {
                    alert("สมัครสมาชิกสำเร็จ! กำลังไปยังหน้าหลัก");
                    window.location.href = "home.html";
                }
            }
        });
    }

    // --- Logic สำหรับหน้า Login ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // ใช้ supabaseClient ที่เราสร้างขึ้น
            const { error } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง: " + error.message);
            } else {
                window.location.href = "home.html";
            }
        });
    }

    // --- Logic สำหรับหน้า Home ---
    if (window.location.pathname.includes("home.html")) {
        handleHomePage();
    }
});


// --- ฟังก์ชันสำหรับจัดการหน้า Home ---
async function handleHomePage() {
    // ใช้ supabaseClient ที่เราสร้างขึ้น
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        window.location.href = "login.html";
        return;
    }

    const user = session.user;
    
    // ดึง Elements
    const usernameDisplay = document.getElementById('username-display');
    const profilePic = document.getElementById('profile-pic');
    const fileUpload = document.getElementById('file-upload');
    const userInfoForm = document.getElementById('user-info-form');
    const logoutButton = document.getElementById('logout-button');

    // ใช้ supabaseClient ที่เราสร้างขึ้น
    const { data, error } = await supabaseClient.from('users').select('*').eq('id', user.id).single();
    if (error) {
        console.error("Error fetching user data:", error);
    } else if (data) {
        usernameDisplay.textContent = data.username || 'User';
        if (data.profile_pic_url) profilePic.src = data.profile_pic_url;
        document.getElementById('weight').value = data.weight || '';
        document.getElementById('height').value = data.height || '';
        document.getElementById('gender').value = data.gender || 'male';
        document.getElementById('age').value = data.age || '';
        if (data.weight && data.height && data.age && data.gender) {
            calculateAndDisplay(data.weight, data.height, data.age, data.gender);
        }
    }

    // Event Listeners สำหรับหน้า Home
    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        // ใช้ supabaseClient ที่เราสร้างขึ้น
        const { error: uploadError } = await supabaseClient.storage.from('profile_pictures').upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return;
        }

        // ใช้ supabaseClient ที่เราสร้างขึ้น
        const { data: urlData } = supabaseClient.storage.from('profile_pictures').getPublicUrl(filePath);
        const publicURL = urlData.publicUrl;

        profilePic.src = publicURL;
        // ใช้ supabaseClient ที่เราสร้างขึ้น
        await supabaseClient.from('users').update({ profile_pic_url: publicURL }).eq('id', user.id);
    });

    userInfoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const weight = document.getElementById('weight').value;
        const height = document.getElementById('height').value;
        const gender = document.getElementById('gender').value;
        const age = document.getElementById('age').value;

        if (weight && height && gender && age) {
            // ใช้ supabaseClient ที่เราสร้างขึ้น
            const { error } = await supabaseClient.from('users').update({ weight, height, gender, age }).eq('id', user.id);
            if (error) {
                alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
            } else {
                calculateAndDisplay(weight, height, age, gender);
                alert("บันทึกข้อมูลเรียบร้อย!");
            }
        }
    });

    logoutButton.addEventListener('click', async () => {
        // ใช้ supabaseClient ที่เราสร้างขึ้น
        await supabaseClient.auth.signOut();
        window.location.href = "index.html";
    });
}

function calculateAndDisplay(weight, height, age, gender) {
    const bmiResult = document.getElementById('bmi-result');
    const caloriesResult = document.getElementById('calories-result');
    const heightInMeters = height / 100;
    const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    bmiResult.textContent = bmi;
    let bmr = (gender === 'male')
        ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
        : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    const dailyCalories = (bmr * 1.375).toFixed(0);
    caloriesResult.textContent = `${dailyCalories} kcal`;
}