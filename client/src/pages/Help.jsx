import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function Help() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [expandedFaq, setExpandedFaq] = useState(0);

  const faqs = isAr ? [
    {
      q: 'كيف أبدأ مع TalentFlow؟',
      a: 'قم بتسجيل حساب جديد على الموقع، ثم أنشئ وظيفة وأضف أسئلة مخصصة. بعد ذلك، شارك رابط المقابلة مع المرشحين.'
    },
    {
      q: 'هل يمكن إضافة أسئلة مخصصة للوظيفة؟',
      a: 'نعم، يمكنك إضافة أسئلة تقنية أو سلوكية مخصصة لكل وظيفة. ستظهر هذه الأسئلة مع الأسئلة المولدة من الذكاء الاصطناعي.'
    },
    {
      q: 'ما هي خطط الاشتراك المتاحة؟',
      a: 'لدينا 4 خطط: مجاني (1 وظيفة، 10 متقدمين)، مبتدئ (5 وظائف، 100 متقدم)، احترافي (50 وظيفة، 1000 متقدم)، ومؤسسي (غير محدود).'
    },
    {
      q: 'هل البيانات آمنة؟',
      a: 'نعم، جميع البيانات محمية بتشفير SSL/TLS وقواعد البيانات مشفرة. كلمات المرور مشفرة باستخدام Bcrypt بـ 10 rounds.'
    },
    {
      q: 'كيف يتم تقييم المرشحين؟',
      a: 'يتم التقييم بناءً على 3 معايير: السلوك (40 نقطة)، الموقف (30 نقطة)، والشخصية (30 نقطة). النتيجة النهائية من 100 نقطة.'
    },
    {
      q: 'هل يمكن إضافة أعضاء فريق؟',
      a: 'نعم، يمكنك إضافة أعضاء فريم بأدوار مختلفة (مشرف، HR، محقق)، كل منهم له صلاحيات مختلفة.'
    },
    {
      q: 'ماذا يشمل التقرير النهائي؟',
      a: 'التقرير يشمل: درجات التقييم، تحليل السيرة الذاتية، تحليل DISC للشخصية، التوصيات، والنقاط القوية والضعيفة.'
    },
    {
      q: 'كيف أحصل على الدعم الفني؟',
      a: 'يمكنك التواصل معنا عبر البريد الإلكتروني: support@talentflow.io أو عبر الهاتف: +966-xxxx-xxxx'
    }
  ] : [
    {
      q: 'How do I get started with TalentFlow?',
      a: 'Create a new account on the website, then create a job position and add custom questions. After that, share the interview link with candidates.'
    },
    {
      q: 'Can I add custom questions for a job?',
      a: 'Yes, you can add technical or behavioral questions specific to each job. These will appear alongside AI-generated questions.'
    },
    {
      q: 'What subscription plans are available?',
      a: 'We offer 4 plans: Free (1 job, 10 candidates), Starter (5 jobs, 100 candidates), Pro (50 jobs, 1000 candidates), and Enterprise (unlimited).'
    },
    {
      q: 'Is my data secure?',
      a: 'Yes, all data is protected with SSL/TLS encryption and encrypted databases. Passwords are hashed using Bcrypt with 10 rounds.'
    },
    {
      q: 'How are candidates evaluated?',
      a: 'Evaluation is based on 3 criteria: Behavior (40 points), Attitude (30 points), and Personality (30 points). Final score out of 100.'
    },
    {
      q: 'Can I add team members?',
      a: 'Yes, you can add team members with different roles (admin, HR, recruiter), each with different permissions.'
    },
    {
      q: 'What does the final report include?',
      a: 'The report includes: evaluation scores, CV analysis, DISC personality profile, recommendations, and strengths/weaknesses.'
    },
    {
      q: 'How do I get technical support?',
      a: 'You can contact us via email: support@talentflow.io or phone: +966-xxxx-xxxx'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', padding: '3rem 2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            {isAr ? '❓ المساعدة والأسئلة الشائعة' : '❓ Help & FAQ'}
          </h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            {isAr 
              ? 'إجابات على الأسئلة الأكثر شيوعاً'
              : 'Answers to frequently asked questions'}
          </p>
        </div>

        {/* FAQs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              className="card"
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                borderLeft: expandedFaq === idx ? '4px solid var(--color-primary)' : '4px solid transparent'
              }}
              onClick={() => setExpandedFaq(expandedFaq === idx ? -1 : idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600' }}>
                  {faq.q}
                </h3>
                <span style={{ fontSize: '1.5rem', transition: 'transform 0.3s', transform: expandedFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </div>

              {expandedFaq === idx && (
                <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="card" style={{ marginTop: '3rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>
            {isAr ? '📞 لم تجد ما تبحث عنه؟' : '📞 Didn\'t find what you\'re looking for?'}
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <h4>{isAr ? '📧 البريد الإلكتروني' : '📧 Email'}</h4>
              <p style={{ marginTop: '0.5rem' }}>support@talentflow.io</p>
            </div>
            <div>
              <h4>{isAr ? '📱 الهاتف' : '📱 Phone'}</h4>
              <p style={{ marginTop: '0.5rem' }}>+966-xxxx-xxxx</p>
            </div>
            <div>
              <h4>{isAr ? '🕐 ساعات العمل' : '🕐 Business Hours'}</h4>
              <p style={{ marginTop: '0.5rem' }}>{isAr ? 'السبت - الخميس: 9 ص - 5 م' : 'Saturday - Thursday: 9 AM - 5 PM'}</p>
            </div>
            <div>
              <h4>{isAr ? '🌍 المنطقة الزمنية' : '🌍 Timezone'}</h4>
              <p style={{ marginTop: '0.5rem' }}>GMT+3 (Riyadh, Saudi Arabia)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;
