import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generateDispatchLetter = ({
  agencyName,
  startDate,
  endDate,
  totalEmployees,
  totalPresentDays,
  totalAbsentDays
}) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Municipal Corporation, Faridabad", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("B.K. Chowk N.I.T Faridabad - 121001, Haryana-India", 105, 26, { align: "center" });
  doc.text("Tel. : 0129-2411649, 2411664, 2415549", 105, 31, { align: "center" });
  doc.text("Fax : 0129-2416465", 105, 36, { align: "center" });
  
  doc.line(15, 40, 195, 40); // Horizontal line

  // To Address
  doc.setFontSize(11);
  doc.text("To", 20, 50);
  doc.setFont("helvetica", "bold");
  doc.text(`M/s ${agencyName}`, 30, 56);
  
  // Memo and Date
  const memoNumber = `MCF/AE/SBM/2026/${Math.floor(1000 + Math.random() * 9000)}`;
  const currentDate = new Date().toLocaleDateString('en-GB').replace(/\//g, '.');
  
  doc.setFont("helvetica", "normal");
  doc.text(`Memo No.${memoNumber}`, 30, 70);
  doc.text(`Dated: ${currentDate}`, 150, 70);

  // Subject
  doc.setFont("helvetica", "bold");
  const subjectLines = doc.splitTextToSize(
    "Subject: Show Cause Notice regarding discrepancies in attendance on SWM Portal and non-compliance of contractual provisions",
    160
  );
  doc.text(subjectLines, 20, 85);
  
  let currentY = 85 + (subjectLines.length * 6) + 10;

  // Body Paragraphs
  doc.setFont("helvetica", "normal");
  
  const p1 = `Whereas, during the scrutiny of the SWM portal, it has been observed that discrepancies in manpower attendance have been noted for the dates from ${startDate} to ${endDate}. Further, out of an expected total of ${totalEmployees} employee-days, attendance of only ${totalPresentDays} employee-days has been marked (with ${totalAbsentDays} absent employee-days). This indicates serious lapses in deployment and monitoring of manpower at the field level.`;
  
  const p2 = `Whereas, as per the terms and conditions of the DNIT/agreement, you were required to establish a Complaint Redressal Centre within 15 days from the commencement of the work. However, the same has not been established till date, which is a clear violation of contractual obligations.`;

  const p3 = `In view of the above, you are hereby called upon to show cause within 03 days from the receipt of this notice as to why action should not be taken against you for the above-mentioned lapses and violations.`;
  
  const p4 = `It is further informed that:`;

  const paragraphs = [p1, p2, p3, p4];

  paragraphs.forEach(p => {
    const lines = doc.splitTextToSize(p, 170);
    doc.text(lines, 20, currentY);
    currentY += (lines.length * 5) + 8;
  });

  // Bullet points
  const b1 = `\u2022 A penalty of Rs. 500/- per person per day shall be imposed for absent manpower as per the DNIT/agreement.`;
  const b2 = `\u2022 A penalty of Rs. 5,000/- per day shall be imposed for non-establishment of the Complaint Redressal Centre beyond the stipulated period.`;
  
  [b1, b2].forEach(b => {
    const lines = doc.splitTextToSize(b, 160);
    doc.text(lines, 25, currentY);
    currentY += (lines.length * 5) + 4;
  });

  // Next Page if needed, but normally fits on one page.
  currentY += 15;
  doc.text("In case no satisfactory reply is received within the stipulated period, it shall be presumed that you have nothing to say in your defense and further action, including imposition of penalties and other actions as per the terms and conditions of the agreement, shall be initiated without any further notice.", 20, currentY, { maxWidth: 170 });

  currentY += 30;
  doc.setFont("helvetica", "bold");
  doc.text("Assistant Engineer(SBM)", 130, currentY);
  doc.setFont("helvetica", "normal");
  doc.text("Municipal Corporation", 130, currentY + 5);
  doc.text("Faridabad", 130, currentY + 10);

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Faridabad stepping towards Smart City", 105, 285, { align: "center" });

  // Save the PDF
  doc.save(`Dispatch_Letter_${agencyName.replace(/[^a-zA-Z0-9]/g, '_')}_${currentDate}.pdf`);
};
