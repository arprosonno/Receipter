// Show setup modal on load if no restaurant data saved
window.addEventListener('load', () => {
  if (!localStorage.getItem('restaurantName')) {
    document.getElementById('setupModal').style.display = 'flex';
  }
});

// Handle setup form submission
document.getElementById('setupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  localStorage.setItem('restaurantName', document.getElementById('restaurantName').value);
  localStorage.setItem('restaurantAddress', document.getElementById('restaurantAddress').value);
  localStorage.setItem('restaurantContact', document.getElementById('restaurantContact').value);
  document.getElementById('setupModal').style.display = 'none';
  alert('Restaurant details saved!');
});

async function generateReceipt() {
  const { jsPDF } = window.jspdf;

  // Get restaurant details
  const restaurantName = localStorage.getItem('restaurantName') || 'Restaurant Name';
  const restaurantAddress = localStorage.getItem('restaurantAddress') || 'Restaurant Address';
  const restaurantContact = localStorage.getItem('restaurantContact') || 'Restaurant Contact';

  // Get form data
  const tableNumber = document.getElementById('tableNumber').value;
  const waiterName = document.getElementById('waiterName').value;
  const customerName = document.getElementById('customerName').value;
  const customerContact = document.getElementById('customerContact').value;
  const items = document.getElementById('items').value.split(',').map(i => i.trim());
  const rates = document.getElementById('rates').value.split(',').map(r => parseFloat(r.trim()));
  const quantities = document.getElementById('quantities').value.split(',').map(q => parseInt(q.trim()));
  const vatPercent = parseFloat(document.getElementById('vat').value);
  const serviceCharge = parseFloat(document.getElementById('serviceCharge').value);
  const otherChargesInput = document.getElementById('otherCharges').value;

  // Validate matching array lengths
  if (!(items.length === rates.length && rates.length === quantities.length)) {
    alert('Error: Items, Rates, and Quantities must match in number!');
    return;
  }

  // Validate rates and quantities are all valid numbers
  for (let i = 0; i < rates.length; i++) {
    if (isNaN(rates[i]) || isNaN(quantities[i])) {
      alert('Error: All rates and quantities must be valid numbers!');
      return;
    }
  }

  // Parse other charges
  let otherChargesArray = [];
  let otherChargesTotal = 0;
  if (otherChargesInput) {
    otherChargesArray = otherChargesInput.split(',').map(entry => {
      const [label, amount] = entry.split(':').map(e => e.trim());
      const chargeAmount = parseFloat(amount);
      if (isNaN(chargeAmount)) {
        alert(`Error: Invalid charge amount for ${label}!`);
        return;
      }
      otherChargesTotal += chargeAmount;
      return { label, amount: chargeAmount };
    }).filter(e => e !== undefined);
  }

  // Adjust for typical receipt size: 80mm width x variable height
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 200]
  });

  let y = 10;
  doc.setFontSize(12);
  doc.text(restaurantName, 40, y, { align: 'center' });
  y += 6;
  doc.setFontSize(8);
  doc.text(`Address: ${restaurantAddress}`, 40, y, { align: 'center' });
  y += 4;
  doc.text(`Contact: ${restaurantContact}`, 40, y, { align: 'center' });
  y += 6;
  doc.line(5, y, 75, y);
  y += 4;

  doc.text(`Table: ${tableNumber}`, 5, y);
  doc.text(`Date: ${new Date().toLocaleString()}`, 40, y, { align: 'center' });
  y += 4;
  doc.text(`Waiter: ${waiterName}`, 5, y);
  y += 4;
  doc.text(`Customer: ${customerName}`, 5, y);
  y += 4;
  doc.text(`Contact: ${customerContact}`, 5, y);
  y += 6;

  doc.line(5, y, 75, y);
  y += 4;
  doc.text('Item', 5, y);
  doc.text('Rate', 35, y);
  doc.text('Qty', 50, y);
  doc.text('Total', 65, y);
  y += 4;
  doc.line(5, y, 75, y);
  y += 4;

  let subTotal = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const rate = rates[i];
    const qty = quantities[i];
    const total = rate * qty;
    subTotal += total;

    doc.text(item, 5, y);
    doc.text(rate.toFixed(2), 35, y);
    doc.text(qty.toString(), 50, y);
    doc.text(total.toFixed(2), 65, y);
    y += 4;
  }

  doc.line(5, y, 75, y);
  y += 4;
  const vatAmount = subTotal * (vatPercent / 100);
  const grandTotal = subTotal + vatAmount + serviceCharge + otherChargesTotal;

  doc.text(`Subtotal: ${subTotal.toFixed(2)}`, 5, y);
  y += 4;
  doc.text(`VAT (${vatPercent}%): ${vatAmount.toFixed(2)}`, 5, y);
  y += 4;
  doc.text(`Service Charge: ${serviceCharge.toFixed(2)}`, 5, y);
  y += 4;

  otherChargesArray.forEach(charge => {
    doc.text(`${charge.label}: ${charge.amount.toFixed(2)}`, 5, y);
    y += 4;
  });

  doc.text(`Grand Total: ${grandTotal.toFixed(2)}`, 5, y);
  y += 4;
  doc.line(5, y, 75, y);
  y += 6;

  // Footer
  doc.setFontSize(8);
  doc.text('Thank you for dining with us!', 40, y, { align: 'center' });
  y += 4;
  doc.text('Please visit again!', 40, y, { align: 'center' });
  y += 4;
  doc.text('Made by Epic Byte Studio', 40, y, { align: 'center' });
  y += 4;
  doc.text('To know more- epicbytestudio.netlify.app', 40, y, { align: 'center' });
  y += 4;

  // Save PDF
  doc.save('receipt.pdf');

  // Prepare and send email via FormSubmit
  const emailForm = document.createElement('form');
  emailForm.action = 'https://formsubmit.co/issacprosonno@gmail.com';
  emailForm.method = 'POST';
  emailForm.style.display = 'none';

  const data = {
    'Restaurant Name': restaurantName,
    'Restaurant Address': restaurantAddress,
    'Restaurant Contact': restaurantContact,
    'Table Number': tableNumber,
    'Waiter Name': waiterName,
    'Customer Name': customerName,
    'Customer Contact': customerContact,
    'Items': items.join(', '),
    'Rates': rates.join(', '),
    'Quantities': quantities.join(', '),
    'Subtotal': subTotal.toFixed(2),
    'VAT (%)': vatPercent.toFixed(2),
    'VAT Amount': vatAmount.toFixed(2),
    'Service Charge': serviceCharge.toFixed(2),
    'Other Charges': otherChargesInput,
    'Other Charges Total': otherChargesTotal.toFixed(2),
    'Grand Total': grandTotal.toFixed(2)
  };

  for (const key in data) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = data[key];
    emailForm.appendChild(input);
  }

  const redirect = document.createElement('input');
  redirect.type = 'hidden';
  redirect.name = '_next';
  redirect.value = window.location.href;
  emailForm.appendChild(redirect);

  const noCaptcha = document.createElement('input');
  noCaptcha.type = 'hidden';
  noCaptcha.name = '_captcha';
  noCaptcha.value = 'false';
  emailForm.appendChild(noCaptcha);

  document.body.appendChild(emailForm);
  emailForm.submit();
}
