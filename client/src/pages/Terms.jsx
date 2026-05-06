import { useTranslation } from 'react-i18next';

function Terms() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {isAr ? '📋 شروط الاستخدام' : '📋 Terms of Service'}
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
                <h2>1. قبول الشروط</h2>
                <p>
                  بمجرد استخدامك لمنصة TalentFlow، فأنت توافق على جميع الشروط والأحكام المذكورة هنا. 
                  إذا كنت لا توافق على أي جزء من هذه الشروط، يرجى عدم استخدام المنصة.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>2. وصف الخدمة</h2>
                <p>
                  TalentFlow هي منصة توظيف ذكية تستخدم الذكاء الاصطناعي لتقييم المرشحين وإجراء 
                  المقابلات التلقائية. تقدم المنصة:
                </p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>إدارة الوظائف والمرشحين</li>
                  <li>مقابلات ذكية باستخدام الذكاء الاصطناعي</li>
                  <li>تقييمات مفصلة وتقارير</li>
                  <li>نظام أمان قوي وحماية البيانات</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>3. حقوق التأليف والملكية الفكرية</h2>
                <p>
                  جميع محتويات المنصة بما فيها التصميم والأيقونات والنصوص والخوارزميات هي ملك لشركة 
                  TalentFlow وحماها القانون. يحظر نسخ أو توزيع أي محتوى بدون إذن خطي.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>4. مسؤولية المستخدم</h2>
                <p>أنت مسؤول عن:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>حماية كلمة المرور الخاصة بك</li>
                  <li>صحة البيانات التي تدخلها</li>
                  <li>الامتثال لجميع القوانين المحلية والدولية</li>
                  <li>عدم نشر محتوى غير قانوني أو مسيء</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>5. تحديد المسؤولية</h2>
                <p>
                  TalentFlow توفر الخدمة "كما هي" بدون ضمانات. لا تتحمل المنصة مسؤولية الأضرار 
                  غير المباشرة أو الخسائر المالية. النقرة على الموافقة على هذه الشروط تعني قبول 
                  هذا التحديد.
                </p>
              </section>

              <section>
                <h2>6. التعديل على الشروط</h2>
                <p>
                  نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إخطاركم بأي تغييرات عبر البريد 
                  الإلكتروني. الاستمرار في استخدام المنصة يعتبر موافقة على الشروط الجديدة.
                </p>
              </section>
            </>
          ) : (
            <>
              <section style={{ marginBottom: '2rem' }}>
                <h2>1. Acceptance of Terms</h2>
                <p>
                  By using TalentFlow, you agree to all terms and conditions stated herein. 
                  If you do not agree with any part of these terms, please do not use the platform.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>2. Service Description</h2>
                <p>
                  TalentFlow is a smart recruitment platform powered by artificial intelligence 
                  for candidate evaluation and automated interviews. The platform offers:
                </p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>Job and candidate management</li>
                  <li>AI-powered smart interviews</li>
                  <li>Detailed evaluations and reports</li>
                  <li>Strong security and data protection</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>3. Intellectual Property Rights</h2>
                <p>
                  All platform content including design, icons, text, and algorithms are owned by TalentFlow 
                  and protected by law. Copying or distributing any content without written permission is prohibited.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>4. User Responsibility</h2>
                <p>You are responsible for:</p>
                <ul style={{ marginLeft: '2rem', marginTop: '0.5rem' }}>
                  <li>Protecting your password</li>
                  <li>Accuracy of data you enter</li>
                  <li>Compliance with all local and international laws</li>
                  <li>Not publishing illegal or abusive content</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2>5. Limitation of Liability</h2>
                <p>
                  TalentFlow provides the service "as is" without warranties. The platform is not responsible 
                  for indirect damages or financial losses. Clicking agree means you accept this limitation.
                </p>
              </section>

              <section>
                <h2>6. Amendment of Terms</h2>
                <p>
                  We reserve the right to modify these terms at any time. You will be notified of changes via email. 
                  continued use of the platform constitutes acceptance of the new terms.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Terms;
