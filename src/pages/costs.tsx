// src/pages/production-costs.tsx
import React from 'react';
import { NextPage } from 'next';
import Head from 'next/head';

import ProductionCostsManager from '@/src/components/production-costs/ProductionCostsManager';
import Layout from '../components/layout/Layout';

const ProductionCostsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Gestione Costi di Produzione | CAD CAM App</title>
        <meta name="description" content="Gestisci i costi di produzione basati sui materiali, utensili e tempi di lavorazione" />
      </Head>
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <ProductionCostsManager />
        </div>
      </Layout>
    </>
  );
};

export default ProductionCostsPage;
