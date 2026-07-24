import sys
content = """<section class="management-page">
  <header class="management-header">
    <div>
      <h1 class="page-title">{{ isArabic ? '\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0627\u0644\u0637\u0644\u0627\u0628 \u0645\u0646 Excel' : 'Excel Student Import' }}</h1>
      <p class="page-subtitle">
        {{ isArabic ? '\u0627\u0631\u0641\u0639\u064a \u0645\u0644\u0641 Excel \u0623\u0648 CSV \u0648\u0631\u0627\u062c\u0639\u064a \u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f.' : 'Upload an Excel or CSV file and review import results.' }}
      </p>
    </div>
  </header>

  <div class="management-grid">
    <article class="form-panel panel">
      <h2>{{ isArabic ? '\u0631\u0641\u0639 \u0627\u0644\u0645\u0644\u0641' : 'Upload File' }}</h2>

      <div class="import-type-selector">
        <button class="secondary-button" type="button" [class.active]="importType === 'students'"
          (click)="setImportType('students')">{{ isArabic ? '\u0627\u0644\u0637\u0644\u0627\u0628' : 'Students' }}</button>
        <button class="secondary-button" type="button" [class.active]="importType === 'supervisors'"
          (click)="setImportType('supervisors')">{{ isArabic ? '\u0627\u0644\u0645\u0634\u0631\u0641\u064a\u0646' : 'Supervisors' }}</button>
        <button class="secondary-button" type="button" [class.active]="importType === 'projects'"
          (click)="setImportType('projects')">{{ isArabic ? '\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639' : 'Projects' }}</button>
      </div>

      <label class="upload-box" [class.has-file]="selectedFile">
        <input type="file" accept=".xlsx,.csv" (change)="selectFile($event)">
        <span>{{ selectedFile ? (isArabic ? '\u0627\u0644\u0645\u0644\u0641 \u062c\u0627\u0647\u0632' : 'File Ready') : (isArabic ? '\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0644\u0641 Excel' : 'Choose Excel File') }}</span>
        <small>{{ fileMeta }}</small>
      </label>

      @if (fileError) {
      <p class="form-message error">{{ fileError }}</p>
      }

      <div class="button-row">
        <button class="primary-button" type="button" [disabled]="uploading || !selectedFile" (click)="upload()">
          @if (uploading) {
          <span class="spinner" aria-hidden="true"></span>
          }
          {{ uploading ? (isArabic ? '\u062c\u0627\u0631\u064a \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f...' : 'Importing...') : (isArabic ? '\u0627\u0633\u062a\u064a\u0631\u0627\u062f' : 'Import') }}
        </button>
        <button class="secondary-button" type="button" [disabled]="uploading || !selectedFile" (click)="clearFile()">
          {{ isArabic ? '\u0645\u0633\u062d' : 'Clear' }}
        </button>
      </div>
    </article>

    <article class="table-panel panel" [class.table-expanded]="tableExpanded">
      <h2>{{ isArabic ? '\u0646\u062a\u0627\u0626\u062c \u0627\u0644\u0627\u0633\u062a\u064a\u0631\u0627\u062f' : 'Import Results' }}</h2>
      @if (result) {
      <div class="result-box" [class.error]="result.type === 'error'">
        <strong>{{ resultMessage(result) }}</strong>
        @if (result.details.length) {
        <div class="table-toolbar compact-toolbar">
          <span class="table-meta">{{ result.details.length }} {{ isArabic ? '\u0631\u0633\u0627\u0626\u0644' : 'messages' }}</span>
          <button class="secondary-button table-view-button" type="button"
            (click)="tableExpanded = !tableExpanded">
            {{ tableExpanded ? (isArabic ? '\u062a\u0635\u063a\u064a\u0631' : 'Collapse') : (isArabic ? '\u0639\u0631\u0636' : 'View') }}
          </button>
        </div>
        <div class="table-wrap result-table-wrap">
          <table class="data-table result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{{ isArabic ? '\u0627\u0644\u0631\u0633\u0627\u0644\u0629' : 'Message' }}</th>
              </tr>
            </thead>
            <tbody>
              @for (detail of result.details; track detail; let index = $index) {
              <tr>
                <td>{{ index + 1 }}</td>
                <td>{{ resultDetail(detail) }}</td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        }
      </div>
      } @else {
      <div class="empty-state">
        <strong>{{ isArabic ? '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u062a\u064a\u062c\u0629 \u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0628\u0639\u062f' : 'No import result yet' }}</strong>
        <span>{{ isArabic ? '\u0627\u062e\u062a\u0627\u0631\u064a \u0645\u0644\u0641\u0627\u064b \u0648\u0627\u0633\u062a\u0648\u0631\u062f\u064a\u0647 \u0644\u0639\u0631\u0636 \u0627\u0644\u0646\u062c\u0627\u062d \u0623\u0648 \u0623\u062e\u0637\u0627\u0621 \u0627\u0644\u062a\u062d\u0642\u0642.' : 'Select a file and import it to see success or validation errors.' }}</span>
      </div>
      }
    </article>
  </div>
</section>
"""
with open("src/app/pages/student-import/student-import.component.html", "w", encoding="utf-8") as f:
    f.write(content)
print("Written successfully")
