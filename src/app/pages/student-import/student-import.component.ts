import { Component, inject } from '@angular/core';
import { AdminDataService } from '../../core/admin-data.service';
import { ImportResult } from '../../core/models';
import { PreferencesService } from '../../core/preferences.service';

@Component({
  selector: 'app-student-import',
  standalone: true,
  templateUrl: './student-import.component.html',
  styleUrl: './student-import.component.scss'
})
export class StudentImportComponent {
  private readonly data = inject(AdminDataService);
  readonly preferences = inject(PreferencesService);

  importType: 'students' | 'supervisors' | 'projects' = 'students';
  selectedFile: File | null = null;
  uploading = false;
  tableExpanded = false;
  result: ImportResult | null = null;
  fileError = '';

  get isArabic(): boolean {
    return this.preferences.state.language === 'ar';
  }

  get fileMeta(): string {
    if (!this.selectedFile) {
      return this.isArabic ? 'الصيغ المدعومة: .xlsx, .csv' : 'Supported: .xlsx, .csv';
    }

    const sizeInKb = Math.max(1, Math.round(this.selectedFile.size / 1024));
    return `${this.selectedFile.name} - ${sizeInKb} KB`;
  }

  setImportType(type: 'students' | 'supervisors' | 'projects'): void {
    if (this.importType === type) {
      return;
    }

    this.importType = type;
    this.clearFile();
  }

  selectFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.result = null;
    this.fileError = '';
    this.selectedFile = null;

    if (!file) {
      return;
    }

    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      this.fileError = this.isArabic ? 'يرجى اختيار ملف Excel بصيغة XLSX أو CSV.' : 'Please select an XLSX or CSV file.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
  }

  upload(): void {
    if (!this.selectedFile) {
      this.fileError = this.isArabic ? 'اختر ملفًا قبل الرفع.' : 'Select a file before upload.';
      return;
    }

    this.uploading = true;
    this.result = null;
    this.fileError = '';

    let request;
    try {
      if (this.importType === 'students') {
        request = this.data.uploadStudentsFile(this.selectedFile);
      } else if (this.importType === 'supervisors') {
        request = this.data.uploadSupervisorsFile(this.selectedFile);
      } else {
        request = this.data.uploadProjectsFile(this.selectedFile);
      }

      request.subscribe({
        next: (result) => {
          console.log('Upload Result:', result);
          this.result = result;
          this.uploading = false;
        },
        error: (err) => {
          console.error('Upload Observable Error:', err);
          this.fileError = 'حدث خطأ غير متوقع أثناء الرفع.';
          this.uploading = false;
        },
        complete: () => {
          this.uploading = false;
        }
      });
    } catch (e: any) {
      console.error('Sync Error during upload initialization:', e);
      this.fileError = e?.message || 'Sync error occurred';
      this.uploading = false;
    }
  }

  clearFile(): void {
    this.selectedFile = null;
    this.fileError = '';
    this.result = null;
  }

  downloadStudentsTemplate(): void {
    const csv = [
      'full_name,academic_number,specialization,project_title',
      'رغد محمد,202310101199,تقنية المعلومات,نظام التقييم الذكي'
    ].join('\n');

    this.downloadCsv(csv, 'students-import-template.csv');
  }

  downloadSupervisorsTemplate(): void {
    const csv = [
      'full_name,email,phone_number,department',
      'د. أحمد سالم,ahmed@example.com,0501234567,علوم الحاسب'
    ].join('\n');

    this.downloadCsv(csv, 'supervisors-import-template.csv');
  }

  downloadProjectsTemplate(): void {
    const csv = [
      'title,description,max_students,supervisor,specialization',
      'نظام التقييم,وصف المشروع هنا,4,د. أحمد سالم,تقنية المعلومات'
    ].join('\n');

    this.downloadCsv(csv, 'projects-import-template.csv');
  }

  resultMessage(result: ImportResult): string {
    if (!this.isArabic) {
      return result.message;
    }

    if (result.type === 'success' && this.importType === 'supervisors') {
      return 'تم استيراد المشرفين بنجاح.';
    }

    if (result.type === 'success' && this.importType === 'projects') {
      return 'تم استيراد المشاريع بنجاح.';
    }

    if (result.type === 'success') {
      return 'تم استيراد الطلاب بنجاح.';
    }

    return 'فشل الاستيراد.';
  }

  resultDetail(detail: string): string {
    if (!this.isArabic) {
      return detail;
    }

    if (detail.startsWith('File:')) {
      return detail.replace('File:', 'الملف:');
    }

    if (detail.startsWith('Added:')) {
      return detail.replace('Added:', 'المضاف:');
    }

    if (detail.startsWith('Updated:')) {
      return detail.replace('Updated:', 'المحدث:');
    }

    if (detail.startsWith('Skipped:')) {
      return detail.replace('Skipped:', 'المتجاوز:');
    }

    if (detail.includes('Laravel server')) {
      return 'تأكد من تشغيل خادم Laravel وأن صيغة الملف صحيحة.';
    }

    return detail;
  }

  private downloadCsv(csv: string, fileName: string): void {
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
