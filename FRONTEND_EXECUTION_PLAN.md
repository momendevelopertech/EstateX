# خطة وتعليمات تنفيذ الواجهة الأمامية

> **الغرض:** هذا الملف هو مصدر المتابعة التنفيذي لتطبيق شاشات EstateX. لا تُنفذ شاشة باعتبارها UI معزولاً: تربط كل مهمة بصورة مرجعية من `design/`، ومهمة من `FIXES_BACKLOG.md`، وFR/User Story، والملفات المتأثرة، ودليل تحقق قبل الانتقال.

## 0. قواعد الأمان

### مرجع التصميم
- استخدم مجلد `design/` (أحرف صغيرة) فقط، وتحقق من الصورة قبل العمل: `test -f "design/..."`.
- لا تستخدم `READMEmd_43992678.png` أو `09-google-stitch-design-promptmd_43992678.png` كمراجع واجهة.
- أصلح جميع الإشارات المتبقية إلى `design/` في الـbacklog والـaudit وأي إعدادات أو imports أو scripts.

### البيانات والمكونات المشتركة
- تبقى طبقة البيانات في `apps/web/lib/`: `api.ts` لعقد الاتصال، `mock-data.ts` لبيانات API-shaped، `types.ts` للأنواع، و`adapters/` لاختيار mock أو HTTP. لا يعلم المكون هل المصدر mock أم API حقيقي.
- تثبت وتُعاد استخدام: `UnitCard`، `StatusBadge`، `ProjectCard`، `Header`، `NotificationDropdown`، `LeadForm`، `InstallmentCalculator`، `BookingSchedulerModal`، `AdminShell`، `AgentShell`، `EmptyState`، `LoadingState`، و`ErrorState`.
- لا تتكرر وحدة أو شارة حالة؛ الحالة لا تكون لوناً فقط. لا يوضع منطق booking/status/payment في مكونات عشوائية، بل في API client أو domain utility.

## 1. Checklist إلزامي لكل TASK

### قبل التعديل
1. اقرأ block المهمة كاملاً في `FIXES_BACKLOG.md`.
2. افتح صورة `design/...png` وحلل layout وtypography والتفاعل وdesktop/tablet/mobile وEN/AR عند وجودها.
3. راجع الكود والمكونات المرتبطة، ووثق اعتماد المهمة على API أو بيانات غير متاحة.

### أثناء التعديل
4. عدل نطاق المهمة الحالية فقط واستخدم المكونات المشتركة.

### بعد التعديل
5. شغل TypeScript/build ثم dev server، وافتح الـURL المطلوب وتحقق من HTML/runtime.
6. التقط screenshot إن توفرت الأداة؛ وإلا سجل `PARTIALLY PASSED` أو `UNVERIFIED` ولا تدع مطابقة بصرية كاملة.
7. اختبر `/ar/`، وdesktop/mobile حسب المراجع. اعمل commit مستقل: `fix(project-card): render hero media and status icons [TASK-001, FR-01, FR-08]`.

## 2. ترتيب التنفيذ

### Batch 1 — Discovery الأساسية
| المهمة | النطاق | الاعتماد |
| --- | --- | --- |
| TASK-001 | `ProjectCard`: hero حقيقي، fallback gradient للحالة null فقط، JetBrains Mono للأسعار، وأيقونات حالة. | home/projects grid/summary |
| TASK-002 | `ProjectFloorBrowser`: vertical floor navigator وavailability bars وselection sync. | `StatusBadge` |
| TASK-003 | Unit details: hero/gallery، floorplan، RTL arrow، price history. | AR/RTL حساس |
| TASK-004 | calculator: sliders للدفع 10–90% والمدة 12–120 وشريط payment delivery. | FR-54 |
| TASK-005 | lead: contact method، date/time، validation/submit، API adapter. | lead/booking |
| TASK-006 | Header bell: unread count، dropdown منسق، mark-as-read. | لا raw JSON |

**بوابة Batch 1:** build ناجح، المكونات reusable، EN/AR صحيحان، ولا توجد تطبيقات status/card مكررة.

### Batch 2 — Sales Agent + Booking (متسلسل)
1. **TASK-007:** Agent Login مع أخطاء/loading وredirect آمن إلى leads.
2. **TASK-008:** Agent Leads: table، filters، response-time metrics.
3. **TASK-009:** Lead Detail: profile، activity، viewed units، budget، notes.
4. **TASK-017:** Booking Scheduler modal من Unit Details/Project: slots، selected unit، contact mode، confirmation.

**البوابة:** login → list → details → scheduler قابل للتنقل، ومنطق lead/booking خارج الصفحات، واختبار EN/AR لكل route.

### Batch 3 — Admin Operations
1. **TASK-010:** media grid، upload/dropzone، 360 tagging، reorder.
2. **TASK-011:** permissions matrix والأدوار الخمسة، checkbox/save feedback.
3. **TASK-012:** payment-plan templates، attach project/unit، validation للحصص والنسب.
4. **TASK-013:** KPI/funnel/charts مع mobile fallback.
5. **TASK-014:** audit table/search/action filters، status/colour/icons متسقة.

**البوابة:** `AdminShell` موحد (sidebar/header/notifications)، لا صفحة admin بلا navigation shell، والcontrols keyboard accessible.

### Phase 4 — قرار صريح
نفذ **TASK-015 Developer/White-label** و**TASK-016 CRM/Webhooks** بعد إغلاق Batches 1–3 فقط. يجوز تنفيذ UI، لكن لا يُدعى تشغيل multi-tenant أو CRM integration لمجرد ظهور UI.

## 3. RTL وResponsive checklist

| الموضوع | القاعدة |
| --- | --- |
| اللغة/الاتجاه | ترجمة EN وAR؛ `/en` LTR و`/ar` RTL. |
| الأسهم/sidebar/filters | تعكس الأسهم؛ وتنتقل panels من اليسار إلى اليمين منطقياً. |
| الأرقام والأسعار | تبقى مرتبة منطقياً ولا تنعكس كنص. |
| map/floorplan/masterplan | **لا تنعكس** لأنها تمثل مساحة حقيقية. |
| responsive | Desktop كامل، tablet touch-first، mobile stacked/progressive disclosure. |

## 4. Definition of Done

لا يعلن اكتمال كل التصميمات إلا بجدول لكل task يتضمن URL EN وAR، الصورة المرجعية، الملفات، build/test command، runtime/comparison result، commit hash، وknown limitations. راجع Must FRs وUAT وEN/AR وdesktop/tablet/mobile وNFRs وAPI docs وغياب Critical/High bugs قبل إغلاق phase.

## 5. حالة التنفيذ

| المهمة | الحالة |
| --- | --- |
| TASK-001 Project Card | PARTIALLY PASSED — build verified; visual runtime awaits seeded API |
| TASK-002 Floor Browser | PARTIALLY PASSED — build verified; visual runtime awaits seeded API |
| TASK-003 Unit Details | PARTIALLY PASSED — gallery and RTL back link implemented; price history pending |
| TASK-004 Calculator | PARTIALLY PASSED — range sliders and delivery row implemented |
| TASK-005 Lead Form | PARTIALLY PASSED — contact method and viewing datetime submitted through API |
| TASK-006 Notification Dropdown | PARTIALLY PASSED — header bell and readable dropdown implemented |
| TASK-007 Agent Login | NOT STARTED |
| TASK-008 Agent Leads | NOT STARTED |
| TASK-009 Agent Lead Detail | NOT STARTED |
| TASK-017 Booking Scheduler | NOT STARTED |
| TASK-010 Admin Media | NOT STARTED |
| TASK-011 Admin Roles | NOT STARTED |
| TASK-012 Admin Payment Plans | NOT STARTED |
| TASK-013 Admin Analytics | NOT STARTED |
| TASK-014 Admin Audit | NOT STARTED |
| TASK-015 Developer / White-label | NOT STARTED — final phase |
| TASK-016 CRM / Webhooks | NOT STARTED — final phase |

## 6. سجل التحقق

| TASK | Reference | Files | Build/Test | Runtime | Comparison | Commit | Limitations |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | `design/01-public-discovery-flow/EN/Project_Home_EN_-_Desktop_bf440991.png` | `ProjectCard`, `StatusBadge`, projects API/seed | `npm run build:web` passed | `/en` returns 200; API was unavailable | UNVERIFIED — no browser screenshot tool and no seeded API | `HEAD` — TASK-001 commit | Seed the API/database, then capture EN/AR desktop/mobile comparisons |
| TASK-002 | `design/02-location-masterplan-flow/EN/Building_Floor_Explorer_EN_-_Desktop_5d244278.png` | `ProjectFloorBrowser` | `npm run build:web` passed | API unavailable | UNVERIFIED — no browser screenshot tool and no seeded API | Pending | Seed the API/database, then capture EN/AR desktop/mobile comparisons |
| TASK-003–006 | Batch 1 references in `design/` | Unit details, calculator, lead form, notifications | Web/API builds passed | API unavailable | UNVERIFIED — no browser screenshot tool and no seeded API | Pending | Add price history and verify all Batch 1 flows with seeded data |
