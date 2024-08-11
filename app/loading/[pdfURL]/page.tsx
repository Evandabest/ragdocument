"use client";
import usePDFJS  from "../../hooks/usePDFJS"

const LoadingPage = ({params: {pdfURL}}: {params: {pdfURL: string}}) => {

    console.log(pdfURL)
    
    usePDFJS(async (pdfjs) => {
        try {
          const loadingTask = pdfjs.getDocument(pdfURL);
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          let extractedText = "";
    
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map((item: any) => item.str).join(" ");
            extractedText += `Page ${pageNum}:\n${textItems}\n\n`;
          }
    
          console.log(extractedText);
        } catch (error) {
          console.error("Error loading PDF: ", error);
        }
      });

    return (
        <div>
        <h1>Loading...</h1>
        </div>
    );
}

export default LoadingPage;