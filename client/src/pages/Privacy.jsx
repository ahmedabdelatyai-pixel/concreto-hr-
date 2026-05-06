import { useTranslation } from 'react-i18next';

function Privacy() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {isAr ? '🔒 سياسة الخصوصية' : '🔒 Privacy Policy'}
          </h1>
          <p className="text-muted" style={{ fontSize: '1rem' }}>
            {isAr 
              ? 'آخر تحديث: مايو 2026'
              : 'Last updated: May 2026'}
          </p>
        </div>

        {/* Content */}
        <div className="card" style={{ lineHeight: '1.8', fontSize: '1rem' }}>
          {isAr ? (
            <>
              <section style={{ marginBottom: '2rem' }}>
                <h2>1. معلومات نجمعها</h2>
                <p>نجمع المعلومات التالية:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>بيانات الحساب (الاسم، البريد الإلكتروني، رقم الهاتف)</li>
                  <li>بيانات الشركة (اسم الشركة، الموقع، الصناعة)</li>
                  <li>السيرة الذاتية والمعلومات الوظيفية</li>
                  <li>إجابات المقابلات وتقييماتها</li>
                  <li>معلومات الاستخدام (IP، الأجهزة، المتصفحات)</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>2. كيفية استخدام البيانات</h2>
                <p>نستخدم البيانات لـ:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>توفير الخدمات وتحسينها</li>
                  <li>تقييم المرشحين وعمل التقارير</li>
                  <li>الاتصال والدعم الفني</li>
                  <li>تحليل الأداء وتحسين المنصة</li>
                  <li>الامتثال للقوانين القانونية</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>3. حماية البيانات</h2>
                <p>
                  نستخدم تقنيات متقدمة لحماية بيانات المستخدمين:
                </p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>تشفير SSL/TLS لنقل البيانات</li>
                  <li>تشفير قواعد البيانات</li>
                  <li>كلمات مرور مشفرة بـ Bcrypt</li>
                  <li>مراجعات أمنية دورية</li>
                  <li>عدم الوصول إلا من قبل الموظفين المصرح لهم</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>4. مشاركة البيانات</h2>
                <p>
                  لا نشارك بيانات المستخدمين مع أطراف ثالثة إلا في الحالات التالية:
                </p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>بموافقة صريحة من المستخدم</li>
                  <li>متطلبات القانون والسلطات الحكومية</li>
                  <li>مع مقدمي الخدمات الموثوقين (البريد، المدفوعات)</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>5. حقوقك</h2>
                <p>يحق لك:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>الوصول إلى بياناتك الشخصية</li>
                  <li>تصحيح أو تحديث البيانات</li>
                  <li>حذف حسابك وبيانات المرتبطة به</li>
                  <li>الحصول على نسخة من بيانات بصيغة قابلة للنقل</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>6. Cookies والتتبع</h2>
                <p>
                  نستخدم Cookies لتحسين تجربة المستخدم. يمكنك تعطيلها من إعدادات المتصفح دون التأثير 
                  على الخدمات الأساسية.
                </p>
              </section>

              <section>
                <h2>7. التواصل معنا</h2>
                <p>
                  إذا كان لديك أسئلة حول سياسة الخصوصية، يرجى التواصل معنا:
                  <br /><br />
                  <strong>البريد الإلكتروني:</strong> privacy@talentflow.io<br />
                  <strong>الهاتف:</strong> +966-xx-xxxx
                </p>
              </section>
            </>
          ) : (
            <>
              <section style={{ marginBottom: '2rem' }}>
                <h2>1. Information We Collect</h2>
                <p>We collect the following information:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>Account data (name, email, phone)</li>
                  <li>Company information (name, location, industry)</li>
                  <li>Resumes and employment information</li>
                  <li>Interview answers and evaluations</li>
                  <li>Usage information (IP, devices, browsers)</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>2. How We Use Your Data</h2>
                <p>We use data to:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>Provide and improve services</li>
                  <li>Evaluate candidates and generate reports</li>
                  <li>Communication and technical support</li>
                  <li>Analyze performance and improve the platform</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>3. Data Protection</h2>
                <p>
                  We use advanced technologies to protect user data:
                </p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>SSL/TLS encryption for data transmission</li>
                  <li>Database encryption</li>
                  <li>Bcrypt password hashing</li>
                  <li>Regular security audits</li>
                  <li>Access restricted to authorized personnel</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>4. Data Sharing</h2>
                <p>
                  We do not share user data with third parties except in these cases:
                </p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>With explicit user consent</li>
                  <li>Legal requirements and government authorities</li>
                  <li>With trusted service providers (email, payments)</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>5. Your Rights</h2>
                <p>You have the right to:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>Access your personal data</li>
                  <li>Correct or update data</li>
                  <li>Delete your account and associated data</li>
                  <li>Get a copy of your data in portable format</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>6. Cookies and Tracking</h2>
                <p>
                  We use cookies to improve user experience. You can disable them in browser settings 
                  without affecting core services.
                </p>
              </section>

              <section>
                <h2>7. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us:
                  <br /><br />
                  <strong>Email:</strong> privacy@talentflow.io<br />
                  <strong>Phone:</strong> +966-xx-xxxx
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Privacy;
