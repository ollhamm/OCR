const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const upload = document.getElementById("upload");

// Upload image
upload.addEventListener("change", () => {
  const file = upload.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      sendToOCRSpace(dataURL);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function sendToOCRSpace(imageData) {
  const apiKey = "";
  const formData = new FormData();
  formData.append("base64Image", imageData);
  formData.append("language", "eng");
  formData.append("isOverlayRequired", false);
  formData.append("isTable", true);
  formData.append("scale", true);

  fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("OCR Response: ", data);
      if (data.OCRExitCode === 1) {
        const parsedText = data.ParsedResults[0].ParsedText;
        console.log("Parsed Text: ", parsedText);

        const textLines = parsedText
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== "");
        console.log("Text Lines: ", textLines);

        generatePDF(textLines);
      } else {
        console.error("OCR API Error: ", data.ErrorMessage);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function processTextLines(lines) {
  const defaultFields = [
    "Hct",
    "RBCs",
    "Pit",
    "WBCs",
    "Neutrophils",
    "Segs",
    "Bands",
    "Lymphocytes",
    "Monocytes",
    "Eosinophils",
    "Basophils",
    "ESR",
    "Fe",
    "Fe Sat",
    "FDP",
    "Ferritin",
    "Fibrinogen",
    "Haptoglobin",
    "Hgb A1c",
    "MCH",
    "MCHC",
    "MCV",
    "PT",
    "aPTT",
    "Reticulocytes",
    "TIBC",
    "Transferrin",
  ];

  // Gabungkan semua baris menjadi satu string
  const combinedText = lines.join(" ").replace(/\s+/g, ' ').trim();
  console.log("Combined Text: ", combinedText);

  // Pisahkan string gabungan menjadi bagian field dan nilai
  const parts = combinedText.split(/ (?=\d|[A-Za-z])/); // Split based on spaces before numbers or words

  // Menyimpan field dan nilai
  const result = {};
  let fieldIndex = 0;

  // Menyimpan semua field dan nilai
  const fieldValues = [];
  const defaultFieldCount = defaultFields.length;
  
  // Ekstrak field dan nilai dari string gabungan
  parts.forEach((part, index) => {
    if (isNaN(part)) {
      // Assume part is a field
      if (fieldIndex < defaultFieldCount) {
        fieldValues[fieldIndex] = part;
      }
    } else {
      // Assume part is a value
      if (fieldIndex < defaultFieldCount) {
        result[defaultFields[fieldIndex]] = part;
        fieldIndex++;
      }
    }
  });

  // Update hasil dengan nilai yang ditemukan
  defaultFields.forEach((field, index) => {
    if (result[field] === undefined) {
      result[field] = '';
    }
  });

  return result;
}

function generatePDF(textLines) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const defaultFields = [
    "Hct",
    "RBCs",
    "Pit",
    "WBCs",
    "Neutrophils",
    "Segs",
    "Bands",
    "Lymphocytes",
    "Monocytes",
    "Eosinophils",
    "Basophils",
    "ESR",
    "Fe",
    "Fe Sat",
    "FDP",
    "Ferritin",
    "Fibrinogen",
    "Haptoglobin",
    "Hgb A1c",
    "MCH",
    "MCHC",
    "MCV",
    "PT",
    "aPTT",
    "Reticulocytes",
    "TIBC",
    "Transferrin",
  ];

  // Gabungkan field dan nilai dari hasil OCR
  const fieldsValues = processTextLines(textLines);
  const tableData = defaultFields.map((defaultField) => {
    return {
      field: defaultField,
      value: fieldsValues[defaultField] || "", // Pastikan field muncul meskipun nilai kosong
    };
  });

  console.log("Table Data: ", tableData); // Debugging line

  doc.text("Hematology", 10, 10);
  doc.autoTable({
    head: [["Field", "Result"]],
    body: tableData.map((row) => [row.field, row.value]),
    startY: 20,
  });

  doc.save("output.pdf");
}
