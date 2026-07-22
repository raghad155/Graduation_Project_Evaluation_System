graph TD
    %% تعريف أنماط الألوان
    classDef startEnd fill:#2b5876,stroke:#1a365d,stroke-width:2px,color:#fff;
    classDef process fill:#f0f4f8,stroke:#102a43,stroke-width:1px,color:#102a43;
    classDef ai fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;

    A([بدء المشروع وتجهيز الفريق]):::startEnd --> B[إدخال المتطلبات الأولية]:::process
    
    B --> C{{الذكاء الاصطناعي: تحويل النص إلى قصص مستخدمين}}:::ai
    
    C --> D[اعتماد وتعديل قصص المستخدمين]:::process
    
    D --> E{{الذكاء الاصطناعي: التنبؤ بالمخاطر واقتراح خطط الوقاية}}:::ai
    
    E --> F[ربط المخاطر بالمهام وإنشاء سجل المخاطر]:::process
    
    F --> G[تخطيط الـ Sprint ونقل المهام لـ Sprint Backlog]:::process
    
    G --> H[تنفيذ المهام وتحديث لوحة Kanban]:::process
    
    H --> I[تحديث ديناميكي حالة الخطر ومصفوفة المخاطر]:::process
    
    I --> J([إغلاق الـ Sprint وتوليد التقرير النهائي]):::startEnd