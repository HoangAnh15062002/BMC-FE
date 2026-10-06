import { Contract } from '../types';
import { formatCurrency, formatDate } from './formatters';
import { parseContractMeta } from './contractHelper';

export function exportContractToWord(contract: Contract) {
  const meta = parseContractMeta(contract);

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
        <title>${meta.contractTitle} - ${contract.contractNo}</title>
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
            margin-top: 15px;
            margin-bottom: 20px;
          }
          table.grid th, table.grid td {
            border: 1px solid #000000;
            padding: 8px 10px;
            font-size: 11pt;
          }
          table.grid th {
            background-color: #f1f5f9;
            font-weight: bold;
            text-align: center;
          }
          .signatures {
            margin-top: 40px;
            width: 100%;
            border: none;
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

        <div class="title">${meta.contractTitle}</div>
        <div class="subtitle">
          Số: <strong>${contract.contractNo}</strong><br>
          Gói thầu / Hạng mục: <strong>${contract.contractName}</strong><br>
          Công trình: <strong>${contract.projectName || `Dự án #${contract.projectId}`}</strong>
        </div>

        <div class="legal">
          - Căn cứ Bộ Luật Dân sự số 91/2015/QH13 ngày 24/11/2015 của Quốc hội nước CHXHCN Việt Nam;<br>
          - Căn cứ Luật Xây dựng số 50/2014/QH13 và Luật Xây dựng sửa đổi số 62/2020/QH14;<br>
          - Căn cứ Nghị định số 37/2015/NĐ-CP ngày 22/04/2015 của Chính phủ quy định chi tiết về hợp đồng xây dựng;<br>
          - Căn cứ năng lực, nhu cầu và thỏa thuận thống nhất giữa hai bên.
        </div>

        <p class="no-indent">Hôm nay, ngày ${formatDate(contract.signedDate)}, tại văn phòng điều hành công trình, hai bên cùng thống nhất ký kết hợp đồng với các điều khoản chi tiết sau:</p>

        <div class="party-title">${meta.partyA.title}:</div>
        <div style="padding-left: 20px;">
          <div>- Đơn vị: <strong>${meta.partyA.name}</strong></div>
          <div>- Người đại diện: <strong>${meta.partyA.rep || 'Ban Lãnh Đạo'}</strong></div>
          <div>- Mã số thuế: <strong>${meta.partyA.taxCode || 'Theo hồ sơ pháp lý'}</strong></div>
          <div>- Địa chỉ / Trụ sở: <strong>${meta.partyA.address || 'Theo hồ sơ hợp đồng'}</strong></div>
        </div>

        <div class="party-title">${meta.partyB.title}:</div>
        <div style="padding-left: 20px;">
          <div>- Đơn vị: <strong>${meta.partyB.name}</strong></div>
          <div>- Người đại diện: <strong>${meta.partyB.rep || 'Ban Giám Đốc'}</strong></div>
          <div>- Mã số thuế: <strong>${meta.partyB.taxCode || '3700148567'}</strong></div>
          <div>- Trụ sở: <strong>${meta.partyB.address || 'Khu đô thị sinh thái Chánh Mỹ, P. Chánh Mỹ, TP. Thủ Dầu Một, Bình Dương'}</strong></div>
        </div>

        <div class="article-title">Điều 1: Phạm Vi Công Việc & Khối Lượng Hợp Đồng</div>
        <p>Bên A đồng ý giao và Bên B đồng ý nhận thực hiện công việc: <strong>${contract.contractName}</strong> trực thuộc công trình <strong>${contract.projectName || `Dự án #${contract.projectId}`}</strong> đúng theo hồ sơ thiết kế, quy chuẩn kỹ thuật xây dựng và cam kết an toàn lao động tuyệt đối.</p>

        <div class="article-title">Điều 2: Giá Trị Hợp Đồng & Phương Thức Thanh Toán</div>
        <p>1. Giá trị hợp đồng ký kết ban đầu: <strong>${formatCurrency(contract.contractValue)}</strong> (Đã bao gồm thuế GTGT ${contract.vatRate || 10}%).</p>
        <p>2. Tổng giá trị thực hiện sau các phụ lục điều chỉnh (nếu có): <strong>${formatCurrency(contract.totalAdjustedValue || contract.contractValue)}</strong>.</p>
        <p>3. Tạm ứng: Bên A thực hiện tạm ứng theo quy chế hợp đồng sau khi Bên B hoàn tất các thủ tục bảo lãnh và hồ sơ pháp lý.</p>
        <p>4. Thanh toán định kỳ: Bên A thanh toán theo từng đợt tương ứng với khối lượng công việc thực tế hoàn thành đã được hai bên nghiệm thu (A-B).</p>
        <p>5. Giữ lại bảo hành: Bên A giữ lại từ 5% giá trị quyết toán làm tiền bảo hành công trình trong thời hạn 12 đến 24 tháng theo quy định.</p>

        <div class="article-title">Điều 3: Tiến Độ Thực Hiện & Bàn Giao</div>
        <p>Bên B cam kết tập trung đầy đủ nhân lực, xe máy thiết bị, vật tư đạt chuẩn kỹ thuật để thi công đảm bảo chất lượng và tiến độ theo tiến độ tổng thể của toàn công trình.</p>

        <div class="article-title">Điều 4: Phụ Lục Hợp Đồng Đã Ký Kết</div>
        <p class="no-indent">Các phụ lục phát sinh / điều chỉnh giá trị và khối lượng được ghi nhận hợp lệ trong hệ thống quản lý BMC:</p>

        <table class="grid">
          <thead>
            <tr>
              <th style="width: 5%;">STT</th>
              <th style="width: 20%;">Số Phụ Lục</th>
              <th style="width: 15%;">Ngày Ký</th>
              <th style="width: 25%;">Giá Trị Điều Chỉnh</th>
              <th style="width: 25%;">Nội Dung Thỏa Thuận</th>
              <th style="width: 10%;">Trạng Thái</th>
            </tr>
          </thead>
          <tbody>
            ${appendicesHtml}
          </tbody>
        </table>

        <div class="article-title">Điều 5: Cam Kết Chung</div>
        <p>Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận trong hợp đồng. Mọi sửa đổi, bổ sung phải được lập thành văn bản (Phụ lục hợp đồng) có chữ ký và đóng dấu của người đại diện có thẩm quyền của cả hai bên.</p>
        <p class="no-indent">Hợp đồng này được lập thành 04 bản có giá trị pháp lý như nhau, mỗi bên giữ 02 bản để làm căn cứ thực hiện.</p>

        <table class="signatures">
          <tr>
            <td>
              <div class="sig-title">ĐẠI DIỆN BÊN A</div>
              <div style="font-size: 11pt; font-style: italic;">(Ký tên & đóng dấu)</div>
            </td>
            <td>
              <div class="sig-title">ĐẠI DIỆN BÊN B</div>
              <div style="font-size: 11pt; font-style: italic;">(Ký tên & đóng dấu)</div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  // Create a Blob with Word mime type
  const blob = new Blob(['\ufeff' + wordContent], {
    type: 'application/msword;charset=utf-8',
  });

  const cleanContractNo = contract.contractNo.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${cleanContractNo}_HopDong_${meta.contractType}.doc`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}
