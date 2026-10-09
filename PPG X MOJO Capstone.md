# **Introduction** 

Fire Guard Solutions  is a fire protection equipment company that currently relies on a manually maintained Portable Document Format (PDF) file to manage and monitor its product records. This practice presents significant challenges in terms of time efficiency, data accuracy, record consistency, and the timely updating of product information, as reliance on manual data entry heavily restricts catalog maintenance and scalability (Niemir et al., 2025). In the contemporary business landscape, sales management processes that continue to rely heavily on manual operations are increasingly inefficient and may hinder effective information management. Although such legacy practices are becoming less common, their continued use presents a critical operational challenge. This transition away from analog data management forms the core of digital transformation, a necessary shift for organizations seeking to displace obsolete manual processes and improve overall operational efficiency (Nadkarni & Prügl, 2020; Reis & Melão, 2023). 

This study aims to design and develop a centralized web-based product catalog for fire protection equipment and their corresponding specifications. The proposed system will provide an organized selection of products with categorical filtering functionalities to facilitate efficient and accessible product discovery. In terms of inventory management, the system will display an updated classification of products based on their availability. These classifications include Local Products, which are available in stock locally; In Stock, which refers to products that are readily available for immediate dispatch; and Indent Products, which are listed in the catalog but temporarily unavailable and will be sourced internationally upon client request. To improve information accessibility, the catalog will provide essential product details, including product descriptions, brand names, sizes, colors, and, most importantly, the prices of the products listed. This information is intended to support and streamline product-related customer inquiries, which aligns with research showing that the accuracy and completeness of digital catalog attributes directly enhance e-commerce efficiency and consumer engagement (Niemir et al., 2025), while successfully implemented digital systems significantly reduce long-term operational costs (Reis & Melão, 2023). 

Moreover, the system will not incorporate a checkout feature. Instead, it will utilize a quotation request functionality wherein, after clients have completed their selection of products and specifications in a request list, they will proceed to the Request button. This feature will direct the client's selected product list and relevant request details to the designated email address of the sales representative. Rather than facilitating an immediate transaction, the request feature acts akin to a Request for Quotation (RFQ), which serves as a vital communication channel between the client and the seller in business-to-business (B2B) environments (You et al., 2017; Zong et al., 2021). This allows the sales representative to review the requested products, verify availability, provide additional information when necessary, and coordinate the succeeding steps of the transaction. This approach aims to improve the efficiency of customer-seller communication while ensuring that product requests are properly documented, evaluated, and addressed (Zong et al., 2021). 

Prior studies have documented the limitations of manually maintained product records, where reliance on paper-based or static digital files leads to data inaccuracy, laborious updating, and inefficient information retrieval (Yulius et al., 2020; Tanaman et al., 2023), while structured product information management has been shown to be central to effective catalog operations (Battistello et al., 2021). Web-based electronic catalogs have likewise been shown to improve product information accessibility, consistency, and stock visibility while reducing manual effort (Budiandru et al., 2020; Aksenta et al., 2026). However, existing research of this kind has concentrated on consumer-oriented retail and general micro, small, and medium enterprise applications, where catalog management is typically embedded within full transactional infrastructures (Lischke et al., 2025). Limited attention has been given to small, specialized distributors that maintain their product records in static documents such as PDF files, and whose three-state availability structure of local, in-stock, and indent products does not correspond to the stock models assumed by conventional e-commerce systems. To the best of the researchers' knowledge, no published system addresses the centralized, web-based catalog management needs of the fire protection equipment distribution context. This study addresses that gap by developing a 

centralized web-based product catalog with categorical filtering, availability-based classification, and an email-based quotation request feature tailored to this setting. 

# **Project Background and Context** 

Fire Guard Solutions, a fire protection equipment company, manages its product records in a manually maintained Portable Document Format (PDF) file that serves as its product catalog and the basis for preparing request orders. Because a PDF is static, any change in price, stock status, or specifications requires editing and redistributing the file, risking outdated information for clients and requesting orders built on stale records. With no structured, searchable database, clients cannot browse by category, compare specifications, or confirm availability on their own, so every transaction depends on manual back-and-forth communication. These difficulties mirror the literature: manual practices produce fragmented information and slow retrieval, which digitalization substantially improves (Yuniarto & Siregar, 2025; Rohma & Opoku, 2026), while web-based e-catalogs ease product identification, reduce ordering errors, and cut the time and cost of stock-related activities (Budiandru et al., 2020; Zaki & Hermawan, 2025). This grounds the three interrelated problems of this study: product information is fragmented and difficult to maintain in a non-searchable PDF, the request order process is manual and error-prone because staff transcribe client selections, and availability is not transparent at the point of selection, lengthening the coordination cycle. 

In response, this study proposes to design, develop, and evaluate  web-based product catalog for Fire  that organizes equipment by category, presents complete product details, classifies availability as Local Products, In Stock, or Indent Products, and replaces checkout with a request feature that emails clients' selections to the designated sales representative. The study seeks to eliminate the manual preparation of request orders, improve the organization, accuracy, and accessibility of product records, and structure client communication, addressing how the catalog should be designed, how its request feature can replace the manual PDF-based process, how it improves record management over the existing catalog, and how acceptable and usable the system is to Fire Guard Solutions’ clients and staff, while remaining limited to product information management and the client request process, excluding payment 

processing, delivery logistics, and integration with Fire Guard Solutions’ accounting or warehouse systems. 

# **Objectives of the Study** 

This study generally aims to design, develop, and evaluate a web-based product information and inventory management system for Fire Guard Solutions that will centralize product records, present updated product information and availability, and facilitate client quotation requests. 

Specifically, this study aims to: 

1. Develop a centralized web-based product catalog with searching, browsing, categorization, and filtering functions that allow clients to locate fire protection equipment efficiently. 

2. Present comprehensive product information, including descriptions, brands, sizes, colors, prices, categories, and availability classifications as Local Products, In Stock products, or Indent Products. 

3. Develop a secure product-maintenance module that allows authorized sales personnel to create, edit, categorize, publish, archive, and update product records. 

4. Develop a request-list and email-based quotation feature that allows clients to select products and specifications and submit their requests to the designated sales representative without an online checkout or payment process. 

5. Evaluate the acceptability and usability of the developed system among Fire Guard Solutions’ clients and authorized sales personnel. 

# **Significance of the Study** 

The Web-Based Product Information and Inventory Management System for Fire Protection Equipment presents various advantages to parties that are involved in manufacturing specialized safety equipment. 

**For Buyers:** The system provides easy access to relevant fire protection equipment faster and distinguishes between various product options efficiently, with a system allowing customers to evaluate all technical details, compliance information, and 

availability status, which can be Local, In Stock, or Indent, without requiring a separate manual lookup from staff. By reducing the waiting time and uncertainty associated with the manual inventory process, the system increases efficiency in customer inquiries and facilitates the generation of quotations and contact with the sales department. 

**For Sales Team:** The system offers  an effective and convenient way to maintain records of their products, ensuring all customers' inquiries are handled and answered using a single, consistent, and current source. It eliminates the time-consuming process of searching for scattered information about the technical aspects of the products or even verifying whether the products are locally applied or need to be stocked. By centralizing information and automating the quotation process, the system allows sales personnel to facilitate efficient processing of leads as well as provide accurate and real-time product availability. 

**For Administration:** The platform allows a secure maintenance environment to manage users' access and configuration of the system. Strict authorization and validation controls allow administrators to ensure that only authorized personnel have the capability to create, modify, categorize, publish, and archive product records. These controls preserve data integrity, prevent contradictory records, and maintain strict changes across the platform. 

**For Business Owners:** The system helps improve data governance and business efficiency in overcoming the problem of inaccessibility of technical data. It establishes accountability for record changes and eliminates any uncertainty about product availability and restrictions regarding supplies. By maintaining a professional online catalog that effectively funnels quote-ready leads to the sales team, owners can ensure high standards of information quality and secure high-end accommodation, offline payments and fulfillment transactions. 

**For Future Researchers:** The findings of this study serve as a basis  who would like to move forward in the field of specialized product information systems and inventory visibility frameworks. The research presents a starting point for the study of inventory management using three-state availability tags instead of advanced warehouse automation systems and secure staff maintenance systems. It opens an opportunity for 

innovation in the field of digital supply chain visibility in high-value industries and contributes to a refinement of processes in specialized equipment. 

# **Scope and Limitations** 

The study covers the design and development of a Web-based Product Information and Inventory Management System for Fire Protection Equipment for Fire Guard Solutions, a fire protection equipment company. The system serves potential clients, who browse and select products, and authorized sales personnel, who maintain the product records. It provides a searchable product catalog with categorical filtering, comprehensive product detail pages showing descriptions, brand names, sizes, colors, and prices, a centralized availability classification of items as Local, In Stock, or Indent, and a quotation request function through which clients compile their selected products and request details and send them directly to the designated sales representative through Gmail from the system's Contact Us page. Through a protected staff maintenance area, authorized personnel can securely create, edit, categorize, publish, and archive products, ensuring that customer queries are resolved using a single, current source of product information. System testing and implementation will take place in a secure academic setting, where access-control measures distinguish between general users and maintenance personnel, although these measures are implemented for evaluation purposes only and carry no legal enforceability. The system addresses the challenge of obtaining reliable product availability information by ensuring that customer inquiries are resolved through a single, authoritative source, thereby supporting efficient product searching, inventory management, and sales communication. Development and evaluation will be carried out within the capstone project period. 

The system is limited to product information management and the client request process. It does not include quantitative stock-tracking databases, automated warehouse inventory management, or stock reordering features. It will also exclude online order processing and all financial transactions, such as digital payment gateways (e.g., credit card processing and e-wallets), automated invoicing, purchase and delivery logistics, real-time shipping and delivery tracking, and supplier integration, since all 

transactions are completed offline through cash or checks and orders are processed entirely by manual procedures. This system will not provide online shopping cart and checkout functionality; client product selection is limited to a request list, a staging area that accumulates items for the quotation request without any checkout or payment semantics. The system likewise does not require or manage customer accounts for public browsing, so user registration forms, a customer profile database, and authentication for general users are excluded. Finally, it makes no regulatory certification decisions: automated mechanisms for determining legal compliance, a certification decision engine, and regulatory auditing are excluded, and the system relies solely on verification of the source data and compliance documents externally provided by the company's clients and suppliers. 

# **Definition of Terms** 

**Acceptability and Usability.** These refer to the extent to which clients and authorized staff find the proposed system useful, understandable, easy to use, and suitable for managing product information and submitting product requests. 

**Availability Classification.** This refers to the system’s categorization of products as Local Products, In Stock, or Indent Products based on their source and current availability. 

**Client.** This refers to a person or organization that browses Fire Guard Solutions’ product catalog and submits a product request through the proposed system. 

**Fire Protection Equipment.** These refer to the fire safety products listed and managed in the proposed system, including their specifications, prices, and availability information. 

**Fire Guard Solutions.** This refers to the fire protection equipment company that serves as the subject organization and intended beneficiary of the proposed system. 

**In Stock.** This refers to products currently available in Fire Guard Solutions’ own warehouse and ready for dispatch, subject to confirmation by the sales representative. **Indent Product.** This refers to a product listed in the catalog that is temporarily unavailable and must be sourced internationally upon client request. 

**Inventory Management.** This refers to the organization, maintenance, updating, and classification of product records and availability information in the proposed system. It does not include automated warehouse control or complex stock-level monitoring. **Local Product.** This refers to products supplied by Fire Guard Solutions’ partner manufacturers located within the Philippines. 

**Product Catalog.** This refers to the centralized collection of fire protection equipment records presented through the proposed web-based system. 

**Product Information.** This refers to the details associated with each product, including its description, brand, size, color, price, category, and availability classification. **Product Request.** This refers to the electronic submission made by a client after selecting desired products and specifications. The request is sent to the designated sales representative for review, availability confirmation, and further coordination. **Sales Representative.** This refers to the authorized Fire Guard Solutions personnel responsible for receiving, reviewing, and responding to client product requests. 

**Web-Based Product Information and Inventory Management System.** This refers to the proposed online application designed to organize product records, display product information and availability, support product searching and filtering, and transmit client product requests to the sales representative. 

**Access-Control Measures.** These refer to the system’s security mechanisms that restrict product-record maintenance functions to authorized personnel while allowing general users to browse products and submit quotation requests. 

**Authorized Sales Personnel.** These refer to employees of Fire Guard Solutions who are permitted to maintain product records, receive quotation requests, verify product availability, and communicate with clients. 

**Categorical Filtering.** This refers to a catalog feature that allows clients to narrow the displayed products according to their assigned fire protection equipment categories. 

**PDF-Based Catalog.** This refers to the existing manually maintained and distributed Portable Document Format file used by Fire Guard Solutions to store and present its product information. 

**Product Information Accessibility.** This refers to the ease with which clients and authorized sales personnel can locate, retrieve, and view product information through the system’s searching, browsing, and filtering features. 

**Product Information Accuracy.** This refers to the extent to which the product descriptions, specifications, prices, categories, and availability displayed in the system correctly reflect the information approved by Fire Guard Solutions. 

**Product Maintenance Module.** This refers to the protected area of the system where authorized personnel can create, edit, categorize, publish, archive, and update product records and availability information. 

**Product Record Maintainability.** This refers to the ease with which authorized personnel can update and manage product details, prices, categories, specifications, and availability information. 

**Product Record Organization.** This refers to the structured arrangement of product records according to their categories, specifications, and availability classifications within the centralized catalog. 

**Quotation Request or Request for Quotation (RFQ).** This refers to a non-transactional inquiry containing the products, specifications, and other details selected by a client and sent through email to the designated sales representative for review and quotation preparation. It does not constitute an order, checkout, or payment. 

**Request List.** This refers to the temporary staging area in which clients compile their selected products and specifications before submitting a quotation request. It does not function as an online shopping cart or checkout facility. 

**Software-Quality Evaluation Criteria.** These refer to the adopted standards or indicators used to assess the acceptability and usability of the developed system among its intended users 

