import { Contract } from '../types';
import { formatCurrency, formatDate } from './formatters';

export function exportContractToWord(contract: Contract) {
  const appendicesHtml = (contract.appendices || []).length > 0
    ? (contract.appendices || [])
        .map(
          (app, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-weight: bold;">${app.appendixNo}</td>
          <td style="text-align: center;">${formatDate(app.signedDate)}</td>
          <td style="text-align: right; font-weight: bold; color: #ea580c;">${formatCurrency(app.valueChange || 0)}</td>
          <td>${app.content || 'Điều chỉnh khối lượng theo thực tế công trình'}</td>
          <td style="text-align: center;">${app.status || 'APPROVED'}</td>
        </tr>
      `
        )
        .join('')
    : '<tr><td colspan="6" style="text-align: center; color: #64748b;">Chưa có phụ lục điều chỉnh</td></tr>';

  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Hợp Đồng Thi Công Xây Dựng - ${contract.contractNo}</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 210mm 297mm; /* A4 */
            margin: 20mm 20mm 20mm 20mm;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Times New Roman', serif;
            font-size: 13pt;
            line-height: 1.5;
            color: #000000;
          }
          .national-header {
            text-align: center;
            margin-bottom: 25px;
          }
          .country {
            font-weight: bold;
            font-size: 12pt;
            text-transform: uppercase;
          }
          .motto {
            font-weight: bold;
            font-size: 12pt;
          }
          .title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            text-transform: uppercase;
            margin: 25px 0 10px 0;
          }
          .subtitle {
            text-align: center;
            font-style: italic;
            font-size: 12pt;
            margin-bottom: 20px;
          }
          .legal {
            font-style: italic;
            font-size: 11pt;
            text-align: justify;
            margin-bottom: 20px;
          }
          .party-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 15px;
            margin-bottom: 5px;
          }
          .article-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-top: 20px;
            margin-bottom: 6px;
          }
          p {
            text-align: justify;
            margin: 6px 0;
            text-indent: 24px;
          }
          p.no-indent {
            text-indent: 0;
          }
          table.grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
            margin-bottom: 20px;
          }
          table.grid th, table.grid td {
            border: 1px solid #000000;
            padding: 6px 8px;
            font-size: 11pt;
          }
          table.grid th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
          }
          .signatures {
            width: 100%;
            margin-top: 40px;
          }
          .signatures td {
            width: 50%;
            text-align: center;
            vertical-align: top;
          }
          .sig-title {
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 70px;
          }
        </style>
      </head>
      <body>
        <div class="national-header">
          <div class="country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
          <div class="motto">Độc lập - Tự do - Hạnh phúc</div>
          <div style="font-size: 10pt;">------------------------</div>
        </div>

        <div class="title">HỢP ĐỒNG THI CÔNG XÂY DỰNG CÔNG TRÌNH</div>
        <div class="subtitle">
          Số: <strong>${contract.contractNo}</strong><br>
          Gói thầu: <strong>${contract.contractName}</strong><br>
          Công trình: <strong>${contract.projectName || `Dự án #${contract.projectId}`}</strong>
        </div>

        <div class="legal">
          - Căn cứ Bộ Luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước CHXHCN Việt Nam;<br>
          - Căn cứ Luật Xây dựng số 50/2014/QH13 và Luật Xây dựng sửa đổi số 62/2020/QH14;<br>
          - Căn cứ Nghị định số 37/2015/NĐ-CP ngày 22/04/2015 của Chính phủ quy định chi tiết về hợp đồng xây dựng;<br>
          - Căn cứ hồ sơ thiết kế, dự toán và thỏa thuận thống nhất giữa hai bên.
        </div>

        <p class="no-indent">Hôm nay, ngày ${formatDate(contract.signedDate)}, tại văn phòng điều hành công trình, hai bên thống nhất ký kết hợp đồng thi công với các điều khoản sau:</p>

        <div class="party-title">BÊN GIAO THẦU (CHỦ ĐẦU TƯ - BÊN A):</div>
        <div style="padding-left: 20px;">
          <div>- Đơn vị: <strong>${contract.projectName?.includes('Móng M02B') ? 'TẬP ĐOÀN NAM LONG GROUP' : 'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG'}</strong></div>
          <div>- Dự án / Công trình: <strong>${contract.projectName || `Dự án #${contract.projectId}`}</strong></div>
          <div>- Địa điểm thi công: <strong>Bình Dương / Theo hồ sơ mời thầu</strong></div>
        </div>

        <div class="party-title">BÊN NHẬN THẦU (NHÀ THẦU THI CÔNG - BÊN B):</div>
        <div style="padding-left: 20px;">
          <div>- Tên doanh nghiệp: <strong>CÔNG TY CỔ PHẦN XÂY DỰNG KỸ THUẬT BMC</strong></div>
          <div>- Người đại diện: <strong>Ban Giám Đốc Công Ty</strong></div>
          <div>- Mã số thuế: <strong>3700148567</strong></div>
          <div>- Trụ sở: <strong>Khu đô thị sinh thái Chánh Mỹ, Phường Chánh Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương</strong></div>
        </div>

        <div class="article-title">Điều 1: Phạm Vi Công Việc & Khối Lượng Thi Công</div>
        <p>Bên A đồng ý giao và Bên B đồng ý nhận thi công trọn gói hạng mục: <strong>${contract.contractName}</strong> đúng theo hồ sơ thiết kế bản vẽ thi công, tiêu chuẩn kỹ thuật xây dựng và cam kết an toàn lao động.</p>

        <div class="article-title">Điều 2: Giá Trị Hợp Đồng & Phương Thức Thanh Toán</div>
        <p>1. Giá trị hợp đồng gốc (đã bao gồm thuế GTGT ${contract.vatRate || 10}%): <strong>${formatCurrency(contract.contractValue)}</strong>.</p>
        <p>2. Tổng giá trị thanh toán sau các phụ lục bổ sung: <strong>${formatCurrency(contract.totalAdjustedValue || contract.contractValue)}</strong>.</p>
        <p>3. Tạm ứng: Bên A tạm ứng 20% giá trị hợp đồng sau khi hợp đồng có hiệu lực và nhận được chứng thư bảo lãnh tạm ứng hợp lệ từ Bên B.</p>
        <p>4. Thanh toán định kỳ: Bên A thanh toán theo từng đợt tương ứng với khối lượng công việc thực tế hoàn thành đã được nghiệm thu (A-B).</p>
        <p>5. Bảo hành công trình: Bên A giữ lại 5% giá trị hợp đồng làm tiền bảo hành công trình trong thời hạn 12 đến 24 tháng theo quy định.</p>

        <div class="article-title">Điều 3: Tiến Độ Thi Công & Nghiệm Thu</div>
        <p>Hợp đồng có hiệu lực thi công kể từ ngày <strong>${formatDate(contract.signedDate)}</strong>. Bên B có trách nhiệm bố trí đầy đủ nhân lực, vật tư thiết bị đạt chuẩn để hoàn thành đúng tiến độ cam kết.</p>

        <div class="article-title">Điều 4: Phụ Lục Hợp Đồng Kèm Theo</div>
        <p class="no-indent">Các phụ lục điều chỉnh phát sinh sau đây là bộ phận không thể tách rời của Hợp đồng này:</p>
        <table class="grid">
          <thead>
            <tr>
              <th style="width: 35px;">STT</th>
              <th style="width: 140px;">Số Phụ Lục</th>
              <th style="width: 95px;">Ngày Ký</th>
              <th style="width: 135px;">Giá Trị Thay Đổi</th>
              <th>Nội Dung Bổ Sung</th>
              <th style="width: 95px;">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${appendicesHtml}
          </tbody>
        </table>

        <table class="signatures">
          <tr>
            <td>
              <div class="sig-title">ĐẠI DIỆN CHỦ ĐẦU TƯ (BÊN A)</div>
              <div><em>(Ký tên và đóng dấu)</em></div>
            </td>
            <td>
              <div class="sig-title">ĐẠI DIỆN NHÀ THẦU BMC (BÊN B)</div>
              <div><em>(Ký tên và đóng dấu)</em></div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordContent], {
    type: 'application/msword;charset=utf-8',
  });

  const downloadLink = document.createElement('a');
  const cleanContractNo = contract.contractNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = `${cleanContractNo}_HopDongGoc_SoanThao.doc`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadLink.href);
}
