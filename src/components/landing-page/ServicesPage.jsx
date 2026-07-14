import React, { useEffect, useState } from "react";
import SEOHead from "../common/SEOHead";
import StructuredData from "../common/StructuredData";
import { pagesSEO } from "../../config/seo";
import {
  generateOrganizationSchema,
  generateLocalBusinessSchema,
  generateServiceSchema
} from "../../utils/schemaGenerators";

import img1 from "../../assets/services/img1.jpg";
import img2 from "../../assets/services/img-handshake.jpg";
import img3 from "../../assets/services/img3.jpg";
import img4 from "../../assets/services/img-office.jpg";
import img5 from "../../assets/services/img5.jpg";
import healthFitnessToolsImg from "../../assets/health_fitness_tools_service.webp";
import diagnosticMicroscopeImg from "../../assets/diagnostic_microscope_service.webp";
import educationAcademyImg from "../../assets/education_academy_classroom_service.webp";
import personalCareWellnessImg from "../../assets/personal_care_reputation_service.webp";
import healthcareDocivoImg from "../../assets/healthcare_docivo_analytics_service.webp";

const sectors = [
  {
    hash: "healthcare",
    title: "Healthcare & Medical",
    detail: "Medical practices face high friction managing patient records across separate scheduling tools and EMR systems. We research your clinical workflows and merge specialized patient-intake AI agents directly with your existing EHR/EMR software to sync calendars, handle inquiries, and automate follow-ups.",
    color: "cyan",
    img: healthcareDocivoImg,
  },
  {
    hash: "education",
    title: "Education & Academies",
    detail: "Institutes struggle to handle massive student admission inquiry volumes scattered across WhatsApp, web forms, and calling databases. We map your intake workflow and merge lead-qualification AI agents with your CRM/LMS software to automatically qualify prospects, schedule demo classes, and send payment reminders.",
    color: "purple",
    img: educationAcademyImg,
  },
  {
    hash: "wellness",
    title: "Personal Care & Wellness",
    detail: "Salons and wellness chains suffer from booking drop-offs and low customer retention due to manual scheduling bottlenecks. We audit your reservation process and merge booking AI agents with your POS/billing systems to automatically send reminders, coordinate waitlists, and prompt repeat visits.",
    color: "pink",
    img: personalCareWellnessImg,
  },
  {
    hash: "diagnostics",
    title: "Diagnostic & Pathology",
    detail: "Pathology labs experience heavy overhead when manually notifying patients and uploading report PDFs into LIS databases. We audit your sample-to-report flow and merge report-generation AI agents with your lab databases to instantly deliver diagnostic results and schedule follow-ups via WhatsApp.",
    color: "blue",
    img: diagnosticMicroscopeImg,
  },
  {
    hash: "fitness",
    title: "Health & Fitness",
    detail: "Gyms and fitness studios lose significant revenue to membership renewal leaks and manual follow-up delays. We audit your member journey and merge renewal tracking AI agents with your membership management software to automatically engage members, trigger renewal links, and collect feedback.",
    color: "green",
    img: healthFitnessToolsImg,
  },
  {
    hash: "legal",
    title: "Legal & Financial Advisory",
    detail: "CA firms and law practices lose billable hours manually collecting documents, invoices, and scheduling initial client assessments. We map your client onboarding and merge document-intake AI agents with your cloud storage and calendars to handle client queries and sync documents securely.",
    color: "orange",
    img: img5,
  },
  {
    hash: "property",
    title: "Property & Real Estate",
    detail: "Brokers lose hot leads to delayed response times and lack of pre-qualification. We audit your buyer/tenant intake and merge lead-routing AI agents with your property database, qualifying clients by budget and timeline, and automatically booking visits.",
    color: "cyan",
    img: img3,
  }
];

export default function ServicesPage() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const handleHashScroll = () => {
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const idx = sectors.findIndex((s) => s.hash === hash);
        if (idx !== -1) {
          setActiveIdx(idx);
          const element = document.getElementById(hash);
          if (element) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 300);
          }
        }
      }
    };

    handleHashScroll();
    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, []);

  const serviceSchemas = sectors.map((sector) => 
    generateServiceSchema({
      id: sector.hash,
      name: sector.title,
      description: sector.detail,
      type: "AI Automation Service",
      category: sector.title,
      additionalProps: {
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          priceSpecification: {
            "@type": "PriceSpecification",
            priceCurrency: "INR"
          }
        }
      }
    })
  );

  const organizationSchema = generateOrganizationSchema();
  const localBusinessSchema = generateLocalBusinessSchema();

  return (
    <>
      <SEOHead
        title={pagesSEO.services.title}
        description={pagesSEO.services.description}
        keywords={pagesSEO.services.keywords}
        path={pagesSEO.services.path}
        image={pagesSEO.services.image}
        type={pagesSEO.services.type}
      />

      <StructuredData data={[
        organizationSchema,
        localBusinessSchema,
        ...serviceSchemas
      ]} />

      <section className="services-page">
        <div className="bg-grid" />
        <div className="container">
          
          <div data-animate style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 className="section-title">
              <span className="reveal-mask">
                <span className="reveal-text">Our Services & <span className="gradient-text">Industries</span></span>
              </span>
            </h2>
            <p className="section-subtitle" style={{ margin: "0 auto", maxWidth: "700px" }}>
              Explore how Seevora integrates custom calendars, billing systems, and bilingual AI agents tailored specifically for your business sector.
            </p>
          </div>

          <div className="services-expanding-container">
            {sectors.map((s, idx) => {
              const isActive = activeIdx === idx;
              return (
                <div
                  key={idx}
                  id={s.hash}
                  className={`services-expanding-card ${isActive ? "active" : ""}`}
                  onMouseEnter={() => setActiveIdx(idx)}
                  onClick={() => setActiveIdx(idx)}
                >
                  <img src={s.img} alt={s.title} className="services-card-bg" />
                  
                  <div className="services-card-title-vertical">
                    {s.title}
                  </div>

                  <div className="services-card-content">
                    <h3 className="services-card-title">{s.title}</h3>
                    <div className="services-card-details-wrapper">
                      <span className="services-card-tag">CHALLENGE & AI SOLUTION</span>
                      <p className="services-card-desc">{s.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
