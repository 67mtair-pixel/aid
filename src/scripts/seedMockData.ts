import { supabase } from '../lib/supabaseClient';

export async function seedMockData() {
  console.log('🌱 بدء إضافة البيانات الوهمية...');

  try {
    await seedOrganizations();
    await seedFamilies();
    await seedBeneficiaries();
    await seedCouriers();
    await seedDistributionCenters();
    await seedInventory();
    await seedGeographicAreas();
    await seedPackages();
    await seedTasks();
    await seedCourierLocations();
    await seedAlerts();
    await seedNotifications();
    await seedFeedback();
    await seedEmergencyContacts();

    console.log('✅ تم إضافة جميع البيانات الوهمية بنجاح!');
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error);
  }
}

async function seedOrganizations() {
  console.log('إضافة المؤسسات...');

  const organizations = [
    {
      name: 'الهلال الأحمر الفلسطيني',
      type: 'إنسانية',
      location: 'غزة',
      contact_person: 'أحمد محمود',
      phone: '+970599123456',
      email: 'contact@redcrescent.ps',
      status: 'active',
      beneficiaries_count: 1250,
      packages_count: 3420,
      completion_rate: 95.5,
      is_popular: true
    },
    {
      name: 'الأونروا',
      type: 'دولية',
      location: 'خان يونس',
      contact_person: 'محمد السيد',
      phone: '+970599234567',
      email: 'info@unrwa.org',
      status: 'active',
      beneficiaries_count: 2340,
      packages_count: 5680,
      completion_rate: 88.3,
      is_popular: true
    },
    {
      name: 'منظمة الإغاثة الإسلامية',
      type: 'خيرية',
      location: 'رفح',
      contact_person: 'عبد الله حسن',
      phone: '+970599345678',
      email: 'help@islamic-relief.ps',
      status: 'active',
      beneficiaries_count: 890,
      packages_count: 2150,
      completion_rate: 82.7,
      is_popular: false
    },
    {
      name: 'الإغاثة الدولية',
      type: 'دولية',
      location: 'جباليا',
      contact_person: 'فاطمة أحمد',
      phone: '+970599456789',
      email: 'info@international-aid.org',
      status: 'active',
      beneficiaries_count: 1560,
      packages_count: 4230,
      completion_rate: 78.9,
      is_popular: true
    },
    {
      name: 'جمعية الهداية الخيرية',
      type: 'خيرية',
      location: 'دير البلح',
      contact_person: 'خالد يوسف',
      phone: '+970599567890',
      email: 'contact@alhidaya.ps',
      status: 'active',
      beneficiaries_count: 670,
      packages_count: 1420,
      completion_rate: 91.2,
      is_popular: false
    }
  ];

  const { error } = await supabase.from('organizations').upsert(organizations, {
    onConflict: 'email',
    ignoreDuplicates: false
  });

  if (error) console.error('خطأ في إضافة المؤسسات:', error);
  else console.log(`✓ تم إضافة ${organizations.length} مؤسسة`);
}

async function seedFamilies() {
  console.log('إضافة العائلات...');

  const families = [
    {
      name: 'عائلة أبو محمد',
      head_of_family: 'محمد أحمد أبو محمد',
      phone: '+970599111111',
      location: 'حي الشجاعية، غزة',
      members_count: 8,
      packages_distributed: 45,
      completion_rate: 92.5,
      total_children: 5,
      total_medical_cases: 2,
      average_age: 24
    },
    {
      name: 'عائلة السعدي',
      head_of_family: 'خالد محمود السعدي',
      phone: '+970599222222',
      location: 'حي الزيتون، غزة',
      members_count: 6,
      packages_distributed: 38,
      completion_rate: 88.7,
      total_children: 4,
      total_medical_cases: 1,
      average_age: 28
    },
    {
      name: 'عائلة النجار',
      head_of_family: 'عبد الله حسن النجار',
      phone: '+970599333333',
      location: 'خان يونس',
      members_count: 10,
      packages_distributed: 52,
      completion_rate: 95.2,
      total_children: 7,
      total_medical_cases: 3,
      average_age: 22
    },
    {
      name: 'عائلة الحلو',
      head_of_family: 'يوسف علي الحلو',
      phone: '+970599444444',
      location: 'رفح',
      members_count: 7,
      packages_distributed: 41,
      completion_rate: 90.1,
      total_children: 5,
      total_medical_cases: 1,
      average_age: 26
    },
    {
      name: 'عائلة قديح',
      head_of_family: 'محمود سعيد قديح',
      phone: '+970599555555',
      location: 'جباليا',
      members_count: 9,
      packages_distributed: 48,
      completion_rate: 87.6,
      total_children: 6,
      total_medical_cases: 2,
      average_age: 23
    }
  ];

  const { error } = await supabase.from('families').upsert(families, {
    onConflict: 'phone',
    ignoreDuplicates: false
  });

  if (error) console.error('خطأ في إضافة العائلات:', error);
  else console.log(`✓ تم إضافة ${families.length} عائلة`);
}

async function seedBeneficiaries() {
  console.log('إضافة المستفيدين...');

  const { data: organizations } = await supabase.from('organizations').select('id').limit(5);
  const { data: families } = await supabase.from('families').select('id').limit(5);

  if (!organizations || !families) return;

  const beneficiaries = [
    // عائلة أبو محمد - 3 أفراد (موثقين ونشطين)
    {
      name: 'محمد أحمد أبو محمد',
      full_name: 'محمد أحمد عبد الله أبو محمد',
      national_id: '900123456',
      date_of_birth: '1990-05-15',
      gender: 'male',
      phone: '+970599111222',
      address: 'حي الشجاعية، شارع الوحدة، بناية 5، شقة 3',
      location: { lat: 31.5234, lng: 34.4512 },
      organization_id: organizations[0].id,
      family_id: families[0].id,
      marital_status: 'married',
      economic_level: 'poor',
      members_count: 8,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 45,
      is_head_of_family: true,
      medical_conditions: ['ضغط الدم', 'السكري']
    },
    {
      name: 'فاطمة خالد أبو محمد',
      full_name: 'فاطمة خالد محمود أبو محمد',
      national_id: '920234567',
      date_of_birth: '1992-08-22',
      gender: 'female',
      phone: '+970599111224',
      address: 'حي الشجاعية، شارع الوحدة، بناية 5، شقة 3',
      location: { lat: 31.5234, lng: 34.4512 },
      organization_id: organizations[0].id,
      family_id: families[0].id,
      marital_status: 'married',
      economic_level: 'poor',
      members_count: 8,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 38,
      is_head_of_family: false,
      medical_conditions: []
    },
    {
      name: 'أحمد محمد أبو محمد',
      full_name: 'أحمد محمد أحمد أبو محمد',
      national_id: '150345678',
      date_of_birth: '2015-03-10',
      gender: 'male',
      phone: '+970599111222',
      address: 'حي الشجاعية، شارع الوحدة، بناية 5، شقة 3',
      location: { lat: 31.5234, lng: 34.4512 },
      organization_id: organizations[0].id,
      family_id: families[0].id,
      marital_status: 'single',
      economic_level: 'poor',
      members_count: 8,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 15,
      is_head_of_family: false,
      medical_conditions: []
    },

    // عائلة السعدي - 2 أفراد (قيد المراجعة)
    {
      name: 'خالد محمود السعدي',
      full_name: 'خالد محمود حسن السعدي',
      national_id: '850456789',
      date_of_birth: '1985-11-18',
      gender: 'male',
      phone: '+970599222333',
      address: 'حي الزيتون، شارع الجلاء، بناية 12',
      location: { lat: 31.5156, lng: 34.4623 },
      organization_id: organizations[1].id,
      family_id: families[1].id,
      marital_status: 'married',
      economic_level: 'very_poor',
      members_count: 6,
      identity_status: 'pending',
      status: 'pending',
      eligibility_status: 'under_review',
      total_packages: 8,
      is_head_of_family: true,
      medical_conditions: []
    },
    {
      name: 'مريم علي السعدي',
      full_name: 'مريم علي يوسف السعدي',
      national_id: '880567890',
      date_of_birth: '1988-07-25',
      gender: 'female',
      phone: '+970599222334',
      address: 'حي الزيتون، شارع الجلاء، بناية 12',
      location: { lat: 31.5156, lng: 34.4623 },
      organization_id: organizations[1].id,
      family_id: families[1].id,
      marital_status: 'married',
      economic_level: 'very_poor',
      members_count: 6,
      identity_status: 'pending',
      status: 'active',
      eligibility_status: 'under_review',
      total_packages: 5,
      is_head_of_family: false,
      medical_conditions: []
    },

    // عائلة النجار - 4 أفراد (موثقين ونشطين)
    {
      name: 'عبد الله حسن النجار',
      full_name: 'عبد الله حسن علي النجار',
      national_id: '920678901',
      date_of_birth: '1992-12-05',
      gender: 'male',
      phone: '+970599333444',
      address: 'خان يونس، شارع الرشيد، بناية 8، الطابق الثاني',
      location: { lat: 31.3469, lng: 34.3029 },
      organization_id: organizations[2].id,
      family_id: families[2].id,
      marital_status: 'married',
      economic_level: 'poor',
      members_count: 10,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 52,
      is_head_of_family: true,
      medical_conditions: ['أمراض قلب']
    },
    {
      name: 'سارة محمد النجار',
      full_name: 'سارة محمد أحمد النجار',
      national_id: '930789012',
      date_of_birth: '1993-04-30',
      gender: 'female',
      phone: '+970599333446',
      address: 'خان يونس، شارع الرشيد، بناية 8، الطابق الثاني',
      location: { lat: 31.3469, lng: 34.3029 },
      organization_id: organizations[2].id,
      family_id: families[2].id,
      marital_status: 'married',
      economic_level: 'poor',
      members_count: 10,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 45,
      is_head_of_family: false,
      medical_conditions: ['ربو']
    },
    {
      name: 'علي عبد الله النجار',
      full_name: 'علي عبد الله حسن النجار',
      national_id: '120890123',
      date_of_birth: '2012-09-14',
      gender: 'male',
      phone: '+970599333444',
      address: 'خان يونس، شارع الرشيد، بناية 8، الطابق الثاني',
      location: { lat: 31.3469, lng: 34.3029 },
      organization_id: organizations[2].id,
      family_id: families[2].id,
      marital_status: 'single',
      economic_level: 'poor',
      members_count: 10,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 20,
      is_head_of_family: false,
      medical_conditions: []
    },
    {
      name: 'ليلى عبد الله النجار',
      full_name: 'ليلى عبد الله حسن النجار',
      national_id: '140901234',
      date_of_birth: '2014-06-20',
      gender: 'female',
      phone: '+970599333444',
      address: 'خان يونس، شارع الرشيد، بناية 8، الطابق الثاني',
      location: { lat: 31.3469, lng: 34.3029 },
      organization_id: organizations[2].id,
      family_id: families[2].id,
      marital_status: 'single',
      economic_level: 'poor',
      members_count: 10,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 18,
      is_head_of_family: false,
      medical_conditions: []
    },

    // عائلة الحلو - 2 أفراد (مرفوضين)
    {
      name: 'يوسف علي الحلو',
      full_name: 'يوسف علي محمد الحلو',
      national_id: '860012345',
      date_of_birth: '1986-02-11',
      gender: 'male',
      phone: '+970599444555',
      address: 'رفح، حي الشابورة، بناية 15',
      location: { lat: 31.2858, lng: 34.2456 },
      organization_id: organizations[3].id,
      family_id: families[3].id,
      marital_status: 'married',
      economic_level: 'moderate',
      members_count: 7,
      identity_status: 'rejected',
      status: 'suspended',
      eligibility_status: 'rejected',
      total_packages: 2,
      is_head_of_family: true,
      medical_conditions: []
    },
    {
      name: 'نور يوسف الحلو',
      full_name: 'نور يوسف علي الحلو',
      national_id: '890123456',
      date_of_birth: '1989-08-17',
      gender: 'female',
      phone: '+970599444556',
      address: 'رفح، حي الشابورة، بناية 15',
      location: { lat: 31.2858, lng: 34.2456 },
      organization_id: organizations[3].id,
      family_id: families[3].id,
      marital_status: 'married',
      economic_level: 'moderate',
      members_count: 7,
      identity_status: 'rejected',
      status: 'suspended',
      eligibility_status: 'rejected',
      total_packages: 1,
      is_head_of_family: false,
      medical_conditions: []
    },

    // عائلة قديح - 2 أفراد (بيانات ناقصة)
    {
      name: 'محمود سعيد قديح',
      full_name: 'محمود سعيد أحمد قديح',
      national_id: '950234567',
      date_of_birth: '1995-01-08',
      gender: 'male',
      phone: '+970599555666',
      address: 'جباليا، مخيم جباليا، بناية 22',
      location: { lat: 31.5392, lng: 34.4889 },
      organization_id: organizations[4].id,
      family_id: families[4].id,
      marital_status: 'married',
      economic_level: 'very_poor',
      members_count: 9,
      identity_status: 'pending',
      status: 'pending',
      eligibility_status: 'under_review',
      total_packages: 3,
      is_head_of_family: true,
      medical_conditions: []
    },
    {
      name: 'هناء خالد قديح',
      full_name: 'هناء خالد محمود قديح',
      national_id: '970345678',
      date_of_birth: '1997-05-12',
      gender: 'female',
      phone: '+970599555667',
      address: 'جباليا، مخيم جباليا، بناية 22',
      location: { lat: 31.5392, lng: 34.4889 },
      family_id: families[4].id,
      marital_status: 'married',
      economic_level: 'very_poor',
      members_count: 9,
      identity_status: 'pending',
      status: 'pending',
      eligibility_status: 'under_review',
      total_packages: 2,
      is_head_of_family: false,
      medical_conditions: []
    },

    // مستفيدين مستقلين - بدون عائلة
    {
      name: 'سامي محمد العطار',
      full_name: 'سامي محمد حسن العطار',
      national_id: '910456789',
      date_of_birth: '1991-12-05',
      gender: 'male',
      phone: '+970599666777',
      address: 'حي الرمال، غزة، شارع الجلاء، بناية 7',
      location: { lat: 31.5201, lng: 34.4515 },
      organization_id: organizations[0].id,
      marital_status: 'divorced',
      economic_level: 'very_poor',
      members_count: 1,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 28,
      is_head_of_family: true,
      medical_conditions: []
    },
    {
      name: 'ليلى أحمد البطش',
      full_name: 'ليلى أحمد عمر البطش',
      national_id: '870567890',
      date_of_birth: '1987-04-30',
      gender: 'female',
      phone: '+970599777888',
      address: 'حي تل الهوى، غزة، شارع النصر، بناية 18',
      location: { lat: 31.5298, lng: 34.4443 },
      organization_id: organizations[1].id,
      marital_status: 'widowed',
      economic_level: 'very_poor',
      members_count: 4,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 35,
      is_head_of_family: true,
      medical_conditions: ['أرملة شهيد']
    },
    {
      name: 'هدى علي الفرا',
      full_name: 'هدى علي محمد الفرا',
      national_id: '930678901',
      date_of_birth: '1993-09-14',
      gender: 'female',
      phone: '+970599888999',
      address: 'دير البلح، شارع صلاح الدين، بناية 9',
      location: { lat: 31.4189, lng: 34.3512 },
      organization_id: organizations[2].id,
      marital_status: 'widowed',
      economic_level: 'very_poor',
      members_count: 6,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'eligible',
      total_packages: 42,
      is_head_of_family: true,
      medical_conditions: []
    },
    {
      name: 'طارق سعد الغول',
      full_name: 'طارق سعد عبد الرحمن الغول',
      national_id: '940789012',
      date_of_birth: '1994-03-22',
      gender: 'male',
      phone: '+970599100200',
      address: 'رفح، حي يبنا، شارع السلام، بناية 4',
      location: { lat: 31.2912, lng: 34.2501 },
      organization_id: organizations[3].id,
      marital_status: 'single',
      economic_level: 'poor',
      members_count: 1,
      identity_status: 'verified',
      status: 'active',
      eligibility_status: 'under_review',
      total_packages: 12,
      is_head_of_family: true,
      medical_conditions: []
    },
    {
      name: 'منى خليل شراب',
      full_name: 'منى خليل محمد شراب',
      national_id: '960890123',
      date_of_birth: '1996-11-09',
      gender: 'female',
      phone: '+970599200300',
      address: 'بيت لاهيا، شارع الفالوجا، بناية 11',
      location: { lat: 31.5467, lng: 34.5012 },
      organization_id: organizations[4].id,
      marital_status: 'single',
      economic_level: 'good',
      members_count: 1,
      identity_status: 'rejected',
      status: 'suspended',
      eligibility_status: 'rejected',
      total_packages: 0,
      is_head_of_family: true,
      medical_conditions: []
    }
  ];

  const { error } = await supabase.from('beneficiaries').upsert(beneficiaries, {
    onConflict: 'national_id',
    ignoreDuplicates: false
  });

  if (error) console.error('خطأ في إضافة المستفيدين:', error);
  else console.log(`✓ تم إضافة ${beneficiaries.length} مستفيد`);
}

async function seedCouriers() {
  console.log('إضافة المندوبين...');

  const couriers = [
    {
      name: 'أحمد عبد الله',
      phone: '+970599100100',
      email: 'ahmad.courier@lasonm.ps',
      status: 'active',
      rating: 4.8,
      completed_tasks: 156,
      current_location: { lat: 31.5234, lng: 34.4512 },
      is_humanitarian_approved: true
    },
    {
      name: 'محمد حسن',
      phone: '+970599200200',
      email: 'mohammed.courier@lasonm.ps',
      status: 'busy',
      rating: 4.6,
      completed_tasks: 142,
      current_location: { lat: 31.5156, lng: 34.4623 },
      is_humanitarian_approved: true
    },
    {
      name: 'علي سعيد',
      phone: '+970599300300',
      email: 'ali.courier@lasonm.ps',
      status: 'active',
      rating: 4.9,
      completed_tasks: 189,
      current_location: { lat: 31.3469, lng: 34.3029 },
      is_humanitarian_approved: true
    },
    {
      name: 'يوسف محمود',
      phone: '+970599400400',
      email: 'yousef.courier@lasonm.ps',
      status: 'busy',
      rating: 4.5,
      completed_tasks: 134,
      current_location: { lat: 31.2858, lng: 34.2456 },
      is_humanitarian_approved: true
    },
    {
      name: 'خالد أحمد',
      phone: '+970599500500',
      email: 'khaled.courier@lasonm.ps',
      status: 'active',
      rating: 4.7,
      completed_tasks: 167,
      current_location: { lat: 31.5392, lng: 34.4889 },
      is_humanitarian_approved: true
    },
    {
      name: 'عمر فتحي',
      phone: '+970599600600',
      email: 'omar.courier@lasonm.ps',
      status: 'offline',
      rating: 4.4,
      completed_tasks: 98,
      current_location: { lat: 31.5201, lng: 34.4515 },
      is_humanitarian_approved: false
    }
  ];

  const { error } = await supabase.from('couriers').upsert(couriers, {
    onConflict: 'email',
    ignoreDuplicates: false
  });

  if (error) console.error('خطأ في إضافة المندوبين:', error);
  else console.log(`✓ تم إضافة ${couriers.length} مندوب`);
}

async function seedDistributionCenters() {
  console.log('إضافة مراكز التوزيع...');

  const centers = [
    {
      name: 'مركز غزة الرئيسي',
      type: 'main',
      location: { lat: 31.5234, lng: 34.4512 },
      address: 'شارع الوحدة، غزة',
      capacity: 5000,
      current_stock: 3200,
      manager_name: 'أحمد محمد',
      manager_phone: '+970599111000',
      status: 'active',
      security_level: 'high',
      certification_status: 'certified'
    },
    {
      name: 'مركز خان يونس',
      type: 'secondary',
      location: { lat: 31.3469, lng: 34.3029 },
      address: 'شارع الرشيد، خان يونس',
      capacity: 3000,
      current_stock: 1800,
      manager_name: 'محمود خالد',
      manager_phone: '+970599222000',
      status: 'active',
      security_level: 'standard',
      certification_status: 'certified'
    },
    {
      name: 'مركز رفح للطوارئ',
      type: 'emergency',
      location: { lat: 31.2858, lng: 34.2456 },
      address: 'حي الشابورة، رفح',
      capacity: 2000,
      current_stock: 1200,
      manager_name: 'عبد الله حسن',
      manager_phone: '+970599333000',
      status: 'active',
      security_level: 'maximum',
      certification_status: 'certified'
    }
  ];

  const { error } = await supabase.from('distribution_centers').insert(centers);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة مراكز التوزيع:', error);
  } else {
    console.log(`✓ تم إضافة ${centers.length} مركز توزيع`);
  }
}

async function seedInventory() {
  console.log('إضافة المخزون...');

  const { data: centers } = await supabase.from('distribution_centers').select('id').limit(3);
  if (!centers || centers.length === 0) return;

  const inventory = [
    {
      distribution_center_id: centers[0].id,
      item_name: 'أرز',
      item_category: 'مواد غذائية',
      current_quantity: 500,
      reserved_quantity: 50,
      minimum_threshold: 100,
      maximum_capacity: 1000,
      unit: 'كجم',
      cost_per_unit: 2.5,
      supplier: 'مورد الحبوب الوطني',
      is_critical: true,
      condition_status: 'good',
      expiry_date: '2025-12-31'
    },
    {
      distribution_center_id: centers[0].id,
      item_name: 'طحين',
      item_category: 'مواد غذائية',
      current_quantity: 350,
      reserved_quantity: 30,
      minimum_threshold: 80,
      maximum_capacity: 800,
      unit: 'كجم',
      cost_per_unit: 1.8,
      supplier: 'مورد الحبوب الوطني',
      is_critical: true,
      condition_status: 'good',
      expiry_date: '2025-11-30'
    },
    {
      distribution_center_id: centers[0].id,
      item_name: 'زيت طبخ',
      item_category: 'مواد غذائية',
      current_quantity: 200,
      reserved_quantity: 20,
      minimum_threshold: 50,
      maximum_capacity: 500,
      unit: 'لتر',
      cost_per_unit: 5.0,
      supplier: 'شركة الزيوت الغذائية',
      is_critical: true,
      condition_status: 'good',
      expiry_date: '2026-06-30'
    },
    {
      distribution_center_id: centers[1].id,
      item_name: 'سكر',
      item_category: 'مواد غذائية',
      current_quantity: 180,
      reserved_quantity: 15,
      minimum_threshold: 60,
      maximum_capacity: 600,
      unit: 'كجم',
      cost_per_unit: 2.2,
      supplier: 'مورد السكريات',
      is_critical: false,
      condition_status: 'good',
      expiry_date: '2026-03-31'
    },
    {
      distribution_center_id: centers[1].id,
      item_name: 'معلبات',
      item_category: 'مواد غذائية',
      current_quantity: 45,
      reserved_quantity: 5,
      minimum_threshold: 100,
      maximum_capacity: 400,
      unit: 'علبة',
      cost_per_unit: 3.5,
      supplier: 'شركة المعلبات الوطنية',
      is_critical: false,
      condition_status: 'fair',
      expiry_date: '2025-09-30'
    },
    {
      distribution_center_id: centers[2].id,
      item_name: 'بطانيات',
      item_category: 'ملابس وأغطية',
      current_quantity: 120,
      reserved_quantity: 10,
      minimum_threshold: 30,
      maximum_capacity: 300,
      unit: 'قطعة',
      cost_per_unit: 15.0,
      supplier: 'مورد المنسوجات',
      is_critical: false,
      condition_status: 'excellent'
    }
  ];

  const { error } = await supabase.from('inventory').insert(inventory);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة المخزون:', error);
  } else {
    console.log(`✓ تم إضافة ${inventory.length} عنصر مخزون`);
  }
}

async function seedGeographicAreas() {
  console.log('إضافة المناطق الجغرافية...');

  const areas = [
    {
      name: 'قطاع غزة',
      type: 'governorate',
      center_point: { lat: 31.5, lng: 34.45 },
      population: 2000000,
      area_km2: 365,
      security_level: 'caution',
      accessibility: 'limited'
    },
    {
      name: 'مدينة غزة',
      type: 'city',
      center_point: { lat: 31.5234, lng: 34.4512 },
      population: 700000,
      area_km2: 56,
      security_level: 'caution',
      accessibility: 'accessible',
      average_delivery_time_minutes: 30
    },
    {
      name: 'خان يونس',
      type: 'city',
      center_point: { lat: 31.3469, lng: 34.3029 },
      population: 400000,
      area_km2: 108,
      security_level: 'caution',
      accessibility: 'accessible',
      average_delivery_time_minutes: 40
    },
    {
      name: 'رفح',
      type: 'city',
      center_point: { lat: 31.2858, lng: 34.2456 },
      population: 250000,
      area_km2: 64,
      security_level: 'dangerous',
      accessibility: 'difficult',
      average_delivery_time_minutes: 50
    }
  ];

  const { error } = await supabase.from('geographic_areas').insert(areas);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة المناطق:', error);
  } else {
    console.log(`✓ تم إضافة ${areas.length} منطقة جغرافية`);
  }
}

async function seedPackages() {
  console.log('إضافة الطرود...');

  const { data: beneficiaries } = await supabase.from('beneficiaries').select('id, organization_id, status, identity_status').limit(18);
  const { data: organizations } = await supabase.from('organizations').select('id').limit(5);

  if (!beneficiaries || !organizations) return;

  const packages = [];

  // المستفيدين الموثقين والنشطين - 2-5 طرود لكل منهم
  const activeBeneficiaries = beneficiaries.filter(b => b.status === 'active' && b.identity_status === 'verified');
  activeBeneficiaries.forEach((ben, i) => {
    const packageCount = 2 + (i % 4); // 2-5 طرود
    for (let j = 0; j < packageCount; j++) {
      const daysPast = j * 7 + i * 2;
      packages.push({
        name: ['طرد غذائي', 'طرد طبي', 'طرد ملابس', 'طرد نظافة'][j % 4],
        type: ['food', 'medical', 'clothing', 'hygiene'][j % 4],
        description: `${['مواد غذائية أساسية', 'أدوية ومستلزمات طبية', 'ملابس للعائلة', 'مواد نظافة'][j % 4]}`,
        value: [150, 80, 120, 60][j % 4],
        funder: ['الهلال الأحمر', 'الأونروا', 'الإغاثة الإسلامية', 'الإغاثة الدولية'][i % 4],
        organization_id: ben.organization_id,
        beneficiary_id: ben.id,
        status: j < 2 ? 'delivered' : (j === 2 ? 'in_delivery' : 'assigned'),
        delivered_at: j < 2 ? new Date(Date.now() - daysPast * 24 * 60 * 60 * 1000).toISOString() : null
      });
    }
  });

  // المستفيدين قيد المراجعة - 1-2 طرود
  const pendingBeneficiaries = beneficiaries.filter(b => b.status === 'pending');
  pendingBeneficiaries.forEach((ben, i) => {
    const packageCount = 1 + (i % 2);
    for (let j = 0; j < packageCount; j++) {
      packages.push({
        name: 'طرد غذائي',
        type: 'food',
        description: 'مواد غذائية أساسية',
        value: 150,
        funder: 'الأونروا',
        organization_id: ben.organization_id,
        beneficiary_id: ben.id,
        status: j === 0 ? 'pending' : 'assigned'
      });
    }
  });

  // المستفيدين الموقوفين - 0-1 طرد فاشل
  const suspendedBeneficiaries = beneficiaries.filter(b => b.status === 'suspended');
  suspendedBeneficiaries.forEach((ben, i) => {
    if (i % 2 === 0) {
      packages.push({
        name: 'طرد غذائي',
        type: 'food',
        description: 'محاولة توصيل فاشلة',
        value: 150,
        funder: 'الإغاثة الدولية',
        organization_id: ben.organization_id,
        beneficiary_id: ben.id,
        status: 'failed'
      });
    }
  });

  const { error } = await supabase.from('packages').insert(packages);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة الطرود:', error);
  } else {
    console.log(`✓ تم إضافة ${packages.length} طرد`);
  }
}

async function seedTasks() {
  console.log('إضافة المهام...');

  const { data: packages } = await supabase.from('packages').select('id, beneficiary_id').limit(8);
  const { data: couriers } = await supabase.from('couriers').select('id').limit(6);

  if (!packages || !couriers) return;

  const tasks = [];
  for (let i = 0; i < packages.length && i < couriers.length; i++) {
    tasks.push({
      package_id: packages[i].id,
      beneficiary_id: packages[i].beneficiary_id,
      courier_id: couriers[i % couriers.length].id,
      status: i < 3 ? 'delivered' : i < 5 ? 'in_progress' : 'assigned',
      scheduled_at: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
      delivered_at: i < 3 ? new Date(Date.now() - (3 - i) * 24 * 60 * 60 * 1000).toISOString() : null,
      delivery_location: { lat: 31.5 + (Math.random() * 0.3), lng: 34.4 + (Math.random() * 0.3) },
      notes: i % 2 === 0 ? 'تسليم عادي' : 'تسليم مستعجل'
    });
  }

  const { error } = await supabase.from('tasks').insert(tasks);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة المهام:', error);
  } else {
    console.log(`✓ تم إضافة ${tasks.length} مهمة`);
  }
}

async function seedCourierLocations() {
  console.log('إضافة مواقع المندوبين...');

  const { data: couriers } = await supabase.from('couriers').select('id').limit(6);
  if (!couriers) return;

  const locations = couriers.map((courier, i) => ({
    courier_id: courier.id,
    latitude: 31.5 + (Math.random() * 0.1),
    longitude: 34.4 + (Math.random() * 0.1),
    accuracy: 10 + Math.random() * 5,
    speed: 20 + Math.random() * 30,
    heading: Math.random() * 360,
    location_type: 'gps',
    battery_level: 70 + Math.floor(Math.random() * 30),
    signal_strength: 80 + Math.floor(Math.random() * 20),
    is_active: i < 4,
    timestamp: new Date().toISOString()
  }));

  const { error } = await supabase.from('courier_locations').insert(locations);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة مواقع المندوبين:', error);
  } else {
    console.log(`✓ تم إضافة ${locations.length} موقع مندوب`);
  }
}

async function seedAlerts() {
  console.log('إضافة التنبيهات...');

  const { data: packages } = await supabase.from('packages').select('id').limit(5);
  if (!packages) return;

  const alerts = [
    {
      type: 'delayed',
      title: 'تأخير في التوصيل',
      description: 'طرد متأخر عن الموعد المحدد',
      related_id: packages[0]?.id,
      related_type: 'package',
      priority: 'high',
      is_read: false
    },
    {
      type: 'urgent',
      title: 'طلب مستعجل',
      description: 'طرد طوارئ يحتاج توصيل فوري',
      related_id: packages[1]?.id,
      related_type: 'package',
      priority: 'critical',
      is_read: false
    },
    {
      type: 'failed',
      title: 'فشل التوصيل',
      description: 'فشل محاولة التوصيل - المستفيد غير متواجد',
      related_id: packages[2]?.id,
      related_type: 'task',
      priority: 'medium',
      is_read: true
    }
  ];

  const { error } = await supabase.from('alerts').insert(alerts);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة التنبيهات:', error);
  } else {
    console.log(`✓ تم إضافة ${alerts.length} تنبيه`);
  }
}

async function seedNotifications() {
  console.log('إضافة الإشعارات...');

  const { data: beneficiaries } = await supabase.from('beneficiaries').select('id').limit(5);
  if (!beneficiaries) return;

  const notifications = [
    {
      recipient_type: 'beneficiary',
      recipient_id: beneficiaries[0]?.id,
      title: 'طردك في الطريق',
      message: 'طردك الغذائي في طريقه إليك، الوصول المتوقع خلال ساعتين',
      type: 'info',
      priority: 'high',
      channel: 'app',
      status: 'sent'
    },
    {
      recipient_type: 'beneficiary',
      recipient_id: beneficiaries[1]?.id,
      title: 'تم تسليم الطرد',
      message: 'تم تسليم طردك بنجاح. نأمل أن تكون راضياً عن خدمتنا',
      type: 'success',
      priority: 'normal',
      channel: 'sms',
      status: 'delivered'
    },
    {
      recipient_type: 'all',
      title: 'تنبيه مخزون',
      message: 'المخزون منخفض لعنصر الأرز',
      type: 'warning',
      priority: 'high',
      channel: 'app',
      status: 'pending'
    }
  ];

  const { error } = await supabase.from('notifications').insert(notifications);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة الإشعارات:', error);
  } else {
    console.log(`✓ تم إضافة ${notifications.length} إشعار`);
  }
}

async function seedFeedback() {
  console.log('إضافة التقييمات...');

  const { data: tasks } = await supabase.from('tasks').select('id, beneficiary_id, courier_id, package_id, status').limit(50);
  if (!tasks || tasks.length === 0) return;

  const deliveredTasks = tasks.filter(t => t.status === 'delivered');
  const feedback = [];

  const positiveComments = [
    'خدمة ممتازة، شكراً لكم على جهودكم',
    'المندوب محترم جداً والتوصيل سريع',
    'الطرد وصل بحالة جيدة والخدمة رائعة',
    'نشكركم على المساعدة، جزاكم الله خيراً',
    'خدمة مميزة وسريعة، بارك الله فيكم'
  ];

  const negativeComments = [
    'التوصيل تأخر قليلاً عن الموعد المحدد',
    'بعض المواد كانت تالفة في الطرد',
    'المندوب لم يتصل قبل الوصول',
    'الطرد ناقص بعض العناصر'
  ];

  deliveredTasks.forEach((task, i) => {
    const isPositive = i % 10 !== 9; // 90% تقييمات إيجابية، 10% سلبية

    feedback.push({
      beneficiary_id: task.beneficiary_id,
      task_id: task.id,
      courier_id: task.courier_id,
      package_id: task.package_id,
      rating: isPositive ? 4.0 + Math.random() * 1.0 : 2.5 + Math.random() * 1.5,
      service_quality_rating: isPositive ? 4.0 + Math.random() * 1.0 : 2.5 + Math.random() * 1.5,
      delivery_time_rating: isPositive ? 4.0 + Math.random() * 1.0 : 2.0 + Math.random() * 1.5,
      package_condition_rating: isPositive ? 4.5 + Math.random() * 0.5 : 3.0 + Math.random() * 1.0,
      courier_behavior_rating: isPositive ? 4.5 + Math.random() * 0.5 : 3.5 + Math.random() * 1.0,
      comments: i % 3 === 0 ? (isPositive ? positiveComments[i % positiveComments.length] : negativeComments[i % negativeComments.length]) : null,
      would_recommend: isPositive,
      feedback_type: 'delivery',
      status: 'reviewed'
    });
  });

  const { error } = await supabase.from('feedback').insert(feedback);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة التقييمات:', error);
  } else {
    console.log(`✓ تم إضافة ${feedback.length} تقييم`);
  }
}

async function seedEmergencyContacts() {
  console.log('إضافة جهات الاتصال الطارئة...');

  const { data: beneficiaries } = await supabase.from('beneficiaries').select('id, name, identity_status').limit(18);
  if (!beneficiaries) return;

  const contacts = [];

  // المستفيدين الموثقين - جهتي اتصال لكل منهم
  const verifiedBeneficiaries = beneficiaries.filter(b => b.identity_status === 'verified');
  verifiedBeneficiaries.forEach((ben, i) => {
    contacts.push({
      beneficiary_id: ben.id,
      name: `أحمد محمود - قريب ${ben.name.split(' ')[0]}`,
      relationship: i % 2 === 0 ? 'أخ' : 'ابن عم',
      phone: `+970599800${String(i).padStart(3, '0')}`,
      is_primary: true,
      can_receive_packages: true,
      verified: true,
      verified_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    contacts.push({
      beneficiary_id: ben.id,
      name: `فاطمة علي - قريبة ${ben.name.split(' ')[0]}`,
      relationship: i % 2 === 0 ? 'أخت' : 'بنت عم',
      phone: `+970599801${String(i).padStart(3, '0')}`,
      is_primary: false,
      can_receive_packages: true,
      verified: true,
      verified_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  });

  // المستفيدين قيد المراجعة - جهة اتصال واحدة
  const pendingBeneficiaries = beneficiaries.filter(b => b.identity_status === 'pending');
  pendingBeneficiaries.forEach((ben, i) => {
    contacts.push({
      beneficiary_id: ben.id,
      name: `خالد سعيد - قريب ${ben.name.split(' ')[0]}`,
      relationship: 'أخ',
      phone: `+970599802${String(i).padStart(3, '0')}`,
      is_primary: true,
      can_receive_packages: false,
      verified: false
    });
  });

  const { error } = await supabase.from('emergency_contacts').insert(contacts);

  if (error && !error.message.includes('duplicate')) {
    console.error('خطأ في إضافة جهات الاتصال:', error);
  } else {
    console.log(`✓ تم إضافة ${contacts.length} جهة اتصال طارئة`);
  }
}
