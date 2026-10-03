‘encom Prurmas 

**A Web-Based Product Information and Inventory Management System for Fire Protection Equipment** 

A Capstone Project Presented to the Faculty of the Institute of Computer Studies Rizal Technological University 

In Partial Fulfillment of the Requirements for the Degree of Bachelor of Science in Information Technology 

**By** 

**AMAR, MARIAN NADINE L. BOHOLST, DIANNE C. DELOS REYES, JOHN EMERSON A. MORES, ROANN NICOLE O. REYES, ALEXANDRA NYANZA D.** 

**September 2026** 

1 

‘encom Prurmas 

## **APPROVAL SHEET** 

This Capstone Project entitled, “ **A Web-Based Product Information and Inventory Management System for Fire Protection Equipment** “, prepared and submitted by **Marian Nadine L. Amar, Dianne C. Boholst, John Emerson A. Delos Reyes, Roann Nicole O. Mores and, Alexandra Nyanza D. Reyes,** in partial fulfillment of the requirements for the degree Bachelor of Science in Information Technology, has been examined and recommended for acceptance and approval for oral examination. 

**DR.LUISA VILLANUEVA** Adviser 

Approved by the Committee of Oral Examination on ____________with a grade of _________. Chairman Member Member 

Accepted as partial fulfillment of the course requirements for the degree in Bachelor of Science in Information Technology. 

**DR. LEA S. NISPEROS** Director Date:_____________ 

2 

‘encom Prurmas 

## **DEDICATION** 

3 

‘encom Prurmas 

## **ACKNOWLEDGMENTS** 

4 

‘encom Prurmas 

**ABSTRACT** 

This study will focus on designing and developing a coordinated product catalog for Fire Guard Solution. Fire Guard Solution is a fire protection equipment company that currently manages its product records in a manually maintained Portable Document Format (PDF) file. This practice makes product information harder to organize, update, and access, explicitly for product specifications, prices, and availability. This proposed system aims to serve as an aid to organize fire safety equipment by category and present complete product information. It will also include an availability classification consisting of Local Products, In Stock, and Indent Products to help clients identify the current status of each item. Product entries will contain details such as description, brand, size, color, and price to support customer inquiries and product selection. 

In addition, instead of a conventional checkout process, the system will use a product request feature. After picking the desired products and specifications, clients can submit their request through a request button, which will then send the selected items and request details to the designated sales representative via email. The representative can then review the request, confirm product availability, provide additional information, and coordinate the next steps. Overall, the proposed system seeks to improve product information management and provide a more organized process for handling customer requests and communication. 

5 



<!-- Start of picture text -->
— — Republic ofthe Philippines<br>STB: t Fy _-RIZAL TECHNOLOGICAL UNIVERSITY<br>‘encom Prurmas LAs— _ itiesINSTITUTE ofMandaluyong OF COM and P asigUTER STUDIES<br>TABLE OF CONTENTS<br>Page<br>TITLE PAGE ……………………………………………………………….<br>APPROVAL SHEET……………………………………………………….<br>DEDICATION ….…………………………………………………………..<br>ACKNOWLEDGMENTS…………………………………………………<br>ABSTRACT ………………………………………………………………..<br>TABLE OF CONTENTS ………………………………………………….<br>LIST OF TABLES …………………………………………………………<br>LIST OF FIGURES ………………………………………………………..<br>CHAPTER<br>I  INTRODUCTION<br>Project Background and Context ………………………..<br>Objectives of the Study… ………..………………….…..<br>Significance of the Study… ………..………………….…<br>Scope and Limitations…………………..……….…….…<br>Definition of Terms …………………………………….…<br>II  REVIEW OF RELATED LITERATURE AND SYSTEMS<br>Theme 1 ……………………..……………….………..….<br>Theme 2 ……..……...………………………………….….<br>.<br>.<br><!-- End of picture text -->

6 

|<br> t Fy<br>_-RIZALTECHNOLOGICALUNIVERSITY<br>LAs _ itiesofMandaluyongand **P**asig<br>‘encom Prurmas<br>—<br>INSTITUTEOFCOM UTER STUDIES|
|---|
|Theme N ……..……...………………………………….….|
|Synthesis …………………………….……………………..|
|**III**<br>**DESIGN AND METHODOLOGY**|
|Technical Background ………………………………….|
|Functional and Non-Functional Requirements………..|
|Design of Software, System, and Processes………….|
|Development Process ………….………….…………...|
|Testing…………………………………………….……….|
|Ethical Considerations………………………….………..|
|**IV**<br>**RESULTS AND DISCUSSIONS**|
|Section Title Based on Objective 1 ……………………….|
|Section Title Based on Objective 2 ……….……………....<br>.|
|.<br>Section Title Based on Objective N  ……………………....|
|**V**<br>**SUMMARY**<br>**OF**<br>**FINDINGS,**<br>**CONCLUSIONS,**<br>**AND**<br>**RECOMMENDATIONS**|
|Summary of Findings ………………………..………………..|
|Conclusions……....…………………….……………..…….....|
|Recommendations…………………………………………..…|
|**REFERENCES**…………………………………………………………………<br>7|



|‘encom Prurmas|t Fy<br>LAs <br>—|<br>_-RIZALTECHNOLOGICALUNIVERSITY<br>_ itiesofMandaluyongand **P**asig<br>INSTITUTEOFCOM UTER STUDIES|
|---|---|---|
|**APPE**|**NDIX**||
||A|Gantt Chart…..…………………………………….………|
||B|Survey Questionnaire…………………………….………|
||N|.<br>.<br>Curriculum Vitae …………………………….……………|



8 

|t Fy<br>LAs <br>‘encom Prurmas<br>—|<br>_-RIZALTECHNOLOGICALUNIVERSITY<br>_ itiesofMandaluyongand **P**asig<br>INSTITUTEOFCOM UTER STUDIES|
|---|---|
||**LIST OF TABLES**|
|**TABLE**|<br>**TITLE**|
|**PAGE**||
|1|Demographic Distribution of Sample……………………………..|



9 

_-RIZAL TECHNOLOGICAL UNIVERSITY ‘encom Prurmas LAs— _ itiesINSTITUTE ofMandaluyong OF COM and **P** asigUTER STUDIES **LIST OF FIGURES FIGURE TITLE PAGE** 1 Agile Methodology in UX…………………………….……….…. 

10 

‘encom Prurmas 

## **CHAPTER I** 

## **INTRODUCTION** 

## **Introduction** 

Fire Guard Solutions is a fire protection equipment company that currently relies on a manually maintained Portable Document Format (PDF) file to manage and monitor its product records. This practice presents significant challenges in terms of time efficiency, data accuracy, record consistency, and the timely updating of product information, as reliance on manual data entry heavily restricts catalog maintenance and scalability (Niemir et al., 2025). In the contemporary business landscape, sales management processes that continue to rely heavily on manual operations are increasingly inefficient and may hinder effective information management. Although such legacy practices are becoming less common, their continued use presents a critical operational challenge. This transition away from analog data management forms the core of digital transformation, a necessary shift for organizations seeking to dislocate obsolete manual processes and improve overall operational efficiency (Nadkarni & Prügl, 2020; Reis & Melão, 2023) 

This study aims to design and develop a centralized product catalog for fire protection equipment and their corresponding specifications. The proposed system will provide an organized selection of products with categorical filtering functionalities to facilitate efficient and accessible product discovery. In terms of inventory management, the system will display an updated classification of products based on its availability. These classifications will include Local 

2 

‘encom Prurmas 

Products, which are available in stock locally. In Stock, which refers to products that are readily available for immediate dispatch, and Indent Products which are products listed in the catalog but are temporarily unavailable and will be sourced internationally upon client request. To improve information accessibility, the catalog will provide essential product details, including product descriptions, brand names, sizes, colors, and, most importantly, the prices of the products listed. This information is intended to support and streamline product-related customer inquiries, which aligns with research showing that the accuracy and completeness of digital catalog attributes directly enhance e-commerce efficiency and consumer engagement (Niemir et al., 2025), while successfully implemented digital systems significantly reduce long-term operational costs (Reis & Melão, 2023). 

Moreover, the system will not incorporate a checkout feature. Instead, it will utilize a product request functionality wherein, after clients have completed their selection of products and specifications in the cart, they will proceed to the Request button. This feature will direct the client’s selected product list and relevant request details to the designated email address of the sales representative. Rather than facilitating an immediate transaction, the request feature acts akin to a Request for Quotation (RFQ), which serves as a vital communication channel between the client and the seller in business-to-business (B2B) environments (You et al., 2017; Zong et al., 2021). This allows the sales representative to review the requested products, verify availability, provide additional information when necessary, and 

3 

‘encom Prurmas 

coordinate the succeeding steps of the transaction. This approach aims to improve the efficiency of customer–seller communication while ensuring that product requests are properly documented, evaluated, and addressed (Zong et al., 2021). 

## **Project Background and Context** 

Fire Guard Solutions is a fire protection equipment company that supplies fire safety products to its clients, yet it manages its product records in a manually maintained Portable Document Format (PDF) file that serves as its product catalog and the basis for preparing request orders. This manual, file-based practice makes product information harder to organize, update, and access, particularly for product specifications, prices, and availability (Yuniarto & Siregar, 2025), because a PDF catalog is a static document in which any change in price, stock status, or product specifications requires editing and redistributing the file, increasing the risk of clients receiving outdated information and of staff preparing request orders based on stale or incomplete records. The absence of a structured, searchable product database also prevents clients from easily browsing items by category, comparing specifications, or confirming availability on their own, so every transaction depends on manual back-and-forth communication with company personnel. 

These difficulties mirror findings in the literature on manual and paper-based business processes. A qualitative case study of a small enterprise found that manual practices across the sales cycle, from order acceptance to 

4 

‘encom Prurmas 

reporting, produced fragmented information, weak internal controls, limited analytical capability, and constrained business growth, with digitalization significantly improving recording accuracy and operational efficiency (Yuniarto & Siregar, 2025). Similarly, a company still relying on manual bookkeeping and spreadsheets experienced frequent data discrepancies, slow information retrieval, and the risk of losing physical archives, problems that a web-based information system substantially reduced by cutting operational errors and accelerating reporting to near real time (Rohma & Opoku, 2026). Prior work also demonstrates that web-based catalogs specifically address the presentation of product information for ordering: a case study of a web-based e-catalog showed that displaying products as images with detailed specifications helped the ordering division locate and identify products more easily, reduced the risk of ordering errors, and cut the cost and time of stock-related activities (Budiandru et al., 2020), while comparable small-enterprise studies report that replacing manual ordering and inventory workflows with a web and mobile-based system featuring a dynamic product catalog, real-time stock information, and order management significantly reduced order processing time, improved inventory accuracy, and enhanced customer satisfaction (Zaki & Hermawan, 2025). Taken together, these studies support the premise that moving from a static PDF catalog to an organized web-based system improves both information management and transaction handling, and they ground the three interrelated problems motivating this study. Fire Guard Solution's product information is fragmented and difficult to maintain 

5 

‘encom Prurmas 

because specifications, prices, pictures, sizes, and availability live inside a PDF that must be edited manually and cannot be searched or filtered by clients, its request order process is manual and slow because clients identify products from the PDF and staff must transcribe those selections into request documents, introducing transcription errors and delays, and product availability is not transparent at the point of selection, so clients frequently submit requests for items whose availability must be confirmed afterward, lengthening the coordination cycle between client and sales representative. 

In response, this study proposes to design, develop, and evaluate a coordinated, web-based product catalog for Fire Guard Solutions that organizes fire safety equipment by category and presents complete product information, with entries containing details such as description, brand, size, color, and price. The system will include an availability classification consisting of Local Products, In Stock, and Indent Products so that clients can identify the current status of each item before submitting a request, and instead of a conventional checkout process, it will provide a product request feature through which clients, after selecting their desired products and specifications, submit their request via a request button that sends the selected items and request details to the designated sales representative by email for review, availability confirmation, and coordination of the next steps. Through this system, the study seeks to eliminate the manual preparation of request orders from a PDF catalog, improve the organization, accuracy, and accessibility of Fire Guard 

6 

### ‘encom Prurmas 

Solutions’ product information, and provide a more structured process for handling client product requests and communication, ultimately answering how such a web-based catalog should be designed to present complete product information with availability classification, how its product request feature can replace the manual PDF-based request order process, how it improves the organization, accuracy, and accessibility of product records compared with the existing PDF catalog, and how acceptable and usable the developed system is to Fire Guard Solutions’ clients and staff in terms of established software quality criteria, while remaining limited to product information management and the client request process and excluding payment processing, delivery logistics, and integration with Fire Guard Solutions’ accounting or warehouse systems. 

## **Objectives of the Study** 

This study generally aims to design, develop, and evaluate a web-based product information and inventory management system for Fire Guard Solutions that will organize fire protection equipment records, improve product information accessibility, display product availability, and provide a structured process for submitting product requests to the sales representative. Specifically, this study aims to: 

1. Design and develop a centralized web-based product catalog for fire protection equipment. 

2. Organize and present complete product information, including product descriptions, brands, sizes, colors, prices, and product categories. 

7 

‘encom Prurmas 

3. Implement an availability classification system that identifies products as Local Products, In Stock, or Indent Products. 

4. Develop a product request feature that allows clients to select products and specifications and submit their requests to the designated sales representative through email. 

5. Improve the organization, accuracy, accessibility, and maintainability of Fire Guard Solutions’ product records compared with its existing manually maintained PDF catalog. 

6. Provide authorized sales personnel with a secure interface for creating, editing, categorizing, publishing, and archiving product records. 

7. Evaluate the developed system’s acceptability and usability among Fire Guard Solutions’ clients and staff based on applicable software quality criteria. **Significance of the Study** 

The Web-Based Product Information and Inventory Management System for Fire Protection Equipment presents various advantages to parties that are involved in manufacturing specialized safety equipment. 

The system provides buyers with easy access to relevant fire protection equipment faster and distinguishes between various product options efficiently, with a system allowing customers to evaluate all technical details, compliance information, and availability status, which can be Local, In Stock, or Indent, without requiring a separate manual lookup from staff. By reducing the waiting time and uncertainty associated with the manual inventory process, the system 

8 

‘encom Prurmas 

increases efficiency in customer inquiries and facilitates the generation of quotations and contact with the sales department. 

The system offers sales teams an effective and convenient way to maintain records of their products, ensuring all customers' inquiries are handled and answered using a single, consistent, and current source. It eliminates the time-consuming process of searching for scattered information about the technical aspects of the products or even verifying whether the products are locally applied or need to be stocked. By centralizing information and automating the quotation process, the system allows sales personnel to facilitate efficient processing of leads as well as provide accurate and real-time product availability. 

The platform allows administrators to provide a secure maintenance environment to manage users' access and configuration of the system. Strict authorization and validation controls allow administrators to ensure that only authorized personnel have the capability to create, modify, categorize, publish, and archive product records. These controls preserve data integrity, prevent contradictory records, and maintain strict changes across the platform. 

The system helps business owners improve data governance and business efficiency in overcoming the problem of inaccessibility of technical data. It establishes accountability for record changes and eliminates any uncertainty about product availability and restrictions regarding supplies. By maintaining a professional online catalog that effectively funnels quote-ready 

9 

‘encom Prurmas 

leads to the sales team, owners can ensure high standards of information quality and secure high-end accommodation, offline payments and fulfillment transactions. 

The findings of this study serve as a basis for future researchers who would like to move forward in the field of specialized product information systems and inventory visibility frameworks. The research presents a starting point for the study of inventory management using three-state availability tags instead of advanced warehouse automation systems and secure staff maintenance systems. It opens an opportunity for innovation in the field of digital supply chain visibility in high-value industries and contributes to a refinement of processes in specialized equipment. 

## **Scope and Limitations** 

The Web-based Product Information and Inventory Management System for Fire Protection Equipment aims to facilitate product searching, inventory management, and sales communication through the development of a dynamic web-based application that would address some of the challenges of managing product specifications and structured inventory. This system would provide service to both potential clients and authorized sales personnel by providing structured features such as a searchable product catalog with categorization and filtering tools, comprehensive product detail pages, and a centralized availability classification system displaying items as Local, In stock, or Indent. Additionally, the platform has a quote generator that allows customers to 

10 

‘encom Prurmas 

communicate with the sales team by sending inquiries and generating quotes directly through Gmail from the system’s Contact Us page. In terms of architecture, the system utilizes modern web technologies for developing responsive user interfaces for customers and alongside a protected staff maintenance area where authorized personnel can securely create, edit, categorize, publish, and archive products, ensuring customers' queries are resolved using a single, current source. 

The live deployment and functionality scope of the system are strictly limited to fire safety equipment only and do not include the development of a complex quantitative inventory stock-control system or automated warehouse, focusing instead on a clear three-state availability label. Given the high monetary value specialization of such products, it should not engage in activities related to online order processing, digital payment processing, purchase and delivery logistics, and integration with suppliers because all financial transactions have to be completed offline using conventional modes of cash or checks and order processing is entirely manual. Moreover, the system does not require or manage customer accounts for public browsing, nor are any regulatory certification decisions included in the system. Rather, the system relies solely upon the verification of the source data and compliance documents that are externally provided by the tenants. Finally, the system testing and implementations for this project will take place in a secure academic setting where security measures will be put in place to distinguish between general users and maintenance actions, none of which will have legal enforceability. 

11 

### ‘encom Prurmas 

## **Definition of Terms** 

**Acceptability and Usability.** These refer to the extent to which clients and authorized staff find the proposed system useful, understandable, easy to use, and suitable for managing product information and submitting product requests. **Availability Classification.** This refers to the system’s categorization of products as Local Products, In Stock, or Indent Products based on their source and current availability. 

**Client.** This refers to a person or organization that browses Fire Guard Solutions’ product catalog and submits a product request through the proposed system. 

**Fire Protection Equipment.** These refer to the fire safety products listed and managed in the proposed system, including their specifications, prices, and availability information. 

**Fire Guard Solutions.** This refers to the fire protection equipment company that serves as the subject organization and intended beneficiary of the proposed system. 

**In Stock.** This refers to products currently available in Fire Guard Solutions’ own warehouse and ready for dispatch, subject to confirmation by the sales representative. 

**Indent Product.** This refers to a product listed in the catalog that is temporarily unavailable and must be sourced internationally upon client request. 

**Inventory Management.** This refers to the organization, maintenance, updating, and classification of product records and availability information in the 

12 

‘encom Prurmas 

proposed system. It does not include automated warehouse control or complex stock-level monitoring. 

**Local Product.** This refers to products supplied by Fire Guard Solutions’ partner manufacturers located within the Philippines. 

**Product Catalog.** This refers to the centralized collection of fire protection equipment records presented through the proposed web-based system. 

**Product Information.** This refers to the details associated with each product, including its description, brand, size, color, price, category, and availability classification. 

**Product Request.** This refers to the electronic submission made by a client after selecting desired products and specifications. The request is sent to the designated sales representative for review, availability confirmation, and further coordination. 

**Sales Representative.** This refers to the authorized Fire Guard Solutions personnel responsible for receiving, reviewing, and responding to client product requests. 

**Web-Based Product Information and Inventory Management System.** This refers to the proposed online application designed to organize product records, display product information and availability, support product searching and filtering, and transmit client product requests to the sales representative. 

13 

‘encom Prurmas 

**CHAPTER II REVIEW OF RELATED LITERATURE AND SYSTEMS** 

## **Synthesis** 



14 



<!-- Start of picture text -->
— — Republic ofthe Philippines<br>STB: t Fy _-RIZAL TECHNOLOGICAL UNIVERSITY<br>‘encom Prurmas LAs— _ itiesINSTITUTE ofMandaluyong OF COM and P asigUTER STUDIES<br><!-- End of picture text -->



<!-- Start of picture text -->
CHAPTER III<br>DESIGN AND METHODOLOGY<br>Technical Background<br>Functional and Non-Functional Requirements<br>Design of Software, System and Processes<br>Development Process<br>Testing<br>Ethical Considerations<br><!-- End of picture text -->

15 

‘encom Prurmas 

## **CHAPTER IV** 

## **RESULTS AND DISCUSSIONS** 

16 

# _-RIZAL TECHNOLOGICAL UNIVERSITY ‘encom Prurmas LAs— _ itiesINSTITUTE ofMandaluyong OF COM and **P** asigUTER STUDIES **CHAPTER V SUMMARY OF FINDINGS, CONCLUSIONS, AND RECOMMENDATIONS** 

17 

ge ‘encom Prurmas 

## **REFERENCES** 

Nadkarni, S., & Prügl, R. (2020). Digital transformation: a review, synthesis and opportunities for future research. Management Review Quarterly, 71, 233–341. <u>https://doi.org/10.1007/s11301-020-00185-7</u> 

Niemir, M., Grajewska, D., & Nitoń, B. (2025). Vision-Language Models for 

E-commerce: Detecting Non-Compliant Product Images in Online Catalogs. Proceedings of the 17th International Conference on Agents and Artificial Intelligence, 1116–1123. https://doi.org/10.5220/0013265000003890 Reis, J., & Melão, N. (2023). Digital transformation: A meta-review and guidelines for future research. Heliyon, 9(e12834). <u>https://doi.org/10.1016/j.heliyon.2023.e12834</u> 

You, L., Yao, D.-Q., Sikora, R. T., & Nag, B. (2017). An Adaptive Supplier Selection Mechanism in E-Procurement Marketplace. Journal of International Technology and Information Management, 26, 94–116. <u>https://doi.org/10.58729/1941-6679.1309</u> 

Zong, K., Yuan, Y., Montenegro-Marin, C. E., & Kadry, S. N. (2021). Or-Based Intelligent Decision Support System for E-Commerce. Journal of Theoretical and Applied Electronic Commerce Research, 16, 1150–1164. <u>https://doi.org/10.3390/jtaer16040065</u> 

18 

‘encom Prurmas 

Budiandru, B., Safuan, S., Arief, R. R. K., & Adesta, E. Y. T. (2020, May 20). Web Based E-Catalog Implementation at TPK-KOJA: Case Study of Stock Inventory Division. https://openalex.org/W3092451132 

Rohma, S. N. F., & Opoku, O. (2026, February 8). Design Get Up System Information Inventory Goods Based Web Using the Waterfall Method at CV. Tekno Maju Jaya. https://doi.org/10.59261/jbt.v6i2.567 

Yuniarto, A. A., & Siregar, I. (2025, September 16). From Manual to Digital: Modernizing the Sales Recording System for Growth at MSME Rumah Abon. <u>https://doi.org/10.69930/jsi.v2i5.537</u> 

Zaki, N. F., & Hermawan, A. (2025). Development of a Mobile Web Information System for Ordering and Managing Local Products. Bit-Tech. <u>https://doi.org/10.32877/bt.v8i2.3263</u> 

19 

‘encom Prurmas 

## **APPENDIX A** 

Request Letter to Conduct the Study 

20 

‘encom Prurmas 

## **APPENDIX B** 

Survey Questionnaire 

21 

‘encom Prurmas 

## **APPENDIX N** 

Curriculum Vitae 

22 

