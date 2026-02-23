# Product Requirements Document (PRD)

**Product Name:** Parent-Centric, Language-Aware Diagnostic Platform for Primary Mathematics
**Platform Type:** Web-based Educational Testing Platform
**Target Launch:** Phase 1 focusing on ages 6–9

## 1. Executive Summary

This project aims to build a secure, low-cost digital assessment platform designed to diagnose children’s mathematical understanding by age. Unlike existing platforms that emphasize repetition over diagnosis , this tool focuses on distinguishing between conceptual mathematical gaps and difficulties in applying mathematics through language-based, real-world problems. The platform uses JSON-driven test generation and AI-powered reporting to separate mathematical competence from language access , ultimately producing clear, actionable learning plans for parents, schools, and tutors.

## 2. Problem Statement & Market Gap

* Primary students often appear competent in isolated skills but struggle to apply them in real-life contexts or word problems.


* Current tools often fail to identify if difficulties stem from mathematical gaps, language comprehension barriers, or cognitive load.


* Most platforms report scores without providing causal explanations and require expert interpretation.


* Parents lack independent, evidence-informed insight into whether private tuition or interventions actually improve underlying understanding.



## 3. Target Audience & Business Model

*
**Users:** Parents and carers , UK primary schools , Multi-academy trusts (MATs) , and Tutors/intervention providers.


* **Revenue Model:**
* Parents: £10 per child per year.


* Schools: £500–£1,000 per year (unlimited pupils).


* MATs and authorities: Bespoke licences.





## 4. Core Features & Requirements

### 4.1. Flexible JSON-Driven Question Engine

The core of the testing platform will be driven by JSON files, allowing for high flexibility, easy content updates, and future scalability.

* **Concept-Specific Testing:** Tests will be generated to thoroughly assess specific concepts (e.g., Division).
*
**Language-Aware Design:** Questions must be parallel and feature increasing language demand:


1. Symbolic calculation.


2. Structured word problems.


3. Narrative, real-world problems.




* **Flexible Question Types:** The schema must support multiple-choice and text-based answers initially, with a decoupled UI architecture that allows easy integration of future formats (e.g., diagram drawing or drag-and-drop).
* **Test Generation:** Tests will be assembled dynamically by fetching an array of specific Question IDs from the JSON repository based on target concept and complexity.

### 4.2. Student Test-Taking Interface

*
**Child-Appropriate Design:** The interface must be parent-led but child-appropriate, ensuring ease of use for young learners.


*
**Low-Stakes Environment:** Assessments will be designed as low-stakes diagnostic tests to reduce student anxiety.


* **Future-Proofing for Adaptive Testing:** The front-end and back-end state management must be built to support dynamic, adaptive testing in the future, where the next question is fetched dynamically based on the pass/fail state of the previous question.

### 4.3. AI-Powered Diagnostic Reporting

The platform is a diagnostic and planning system, not a tuition service. Reports will be generated using AI to provide deep qualitative insights.

*
**Root Cause Analysis:** AI will analyze test performance to identify whether errors arise from mathematical misconceptions, language comprehension barriers, or multi-step reasoning demands.


*
**Concept-Level Scoring:** Scores will be aligned to age expectations at a concept level rather than just giving a broad percentage.


*
**Actionable Next Steps:** The AI report will generate clear next-step learning plans detailing exactly where and how a student can improve.


*
**Longitudinal Tracking:** The system will provide objective diagnostic evidence over time to track the effectiveness of interventions.



### 4.4. Account Management & Compliance

*
**Parent-Centric Control:** Accounts and consent must be managed by parents.


*
**Data Protection:** The platform must collect minimal data and be fully compliant with UK GDPR and the Children’s Code.


*
**Hosting:** Data hosting must be UK-based.


*
**Data Deletion:** The system requires transparent deletion policies.



## 5. System Architecture & Technical Guidelines

* **Backend / API:** REST or GraphQL API to serve JSON question blocks and evaluate answers.
* **Database:** * NoSQL/Document store (like MongoDB or PostgreSQL with JSONB) is recommended to store the highly flexible JSON question schemas.
* Relational tables for user accounts, subscription states, and RBAC (Role-Based Access Control) for Parents vs. Teachers.


* **AI Integration:** Secure pipeline to an LLM (Large Language Model) via API. The system will feed the student's raw answers, question metadata (complexity, language level), and time-taken into a heavily structured prompt to generate the bespoke diagnostic report.

## 6. Future Development Roadmap

*
**Phase 1:** Ages 6–9 coverage, pilot schools, reporting refinement.


*
**Phase 2:** KS2 expansion, implementation of dynamic/adaptive testing logic, longitudinal analytics, and research partnerships.



---

Would you like me to draft the JSON schema structure for the questions, or should we focus on designing the system prompt that will instruct the AI on how to generate the diagnostic reports?
