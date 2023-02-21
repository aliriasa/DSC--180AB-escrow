import React, { useContext, createContext } from 'react';

import { useAddress, useContract, useMetamask, useContractWrite, useContractRead  } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { EditionMetadataWithOwnerOutputSchema } from '@thirdweb-dev/sdk';

// added {} in createContext to fix problem
const StateContext = createContext({});

export const StateContextProvider = ({ children }) => {
    const { contract } = useContract(
        '0x7a81D022CD5C8Fd3C818Cb3Ad09e2aD1bC4382Ac'
    );
    // old contracts
    // 0xC2fC0e412464F3e15Cac0Cd82F7459b3cA89D144
    // const { mutateAsync: createProduct } = useContractWrite(contract, 'createProduct');
    const address = useAddress();    
    const connect = useMetamask();
    /* Finished createProduct */
    const publishProduct = async (form) => {
      const data = await contract.call(
        'createProduct',
        address, // owner 
        form.name, // title
        form.description, // description
        form.price,
        form.amt,
        { value: ethers.utils.parseUnits(form.price.toString(), "wei")});  
      return data;
    }

    /* Finished getAllProducts */
  const getProducts = async () => {
    const products = await contract.call('getAllProducts');
    const parsedProducts = products.map((product, i) => ({
      seller: product.seller,
      name: product.name,
      description: product.description,
      price: ethers.utils.formatEther(product.price.toString()),
      amt: product.amt.toNumber(),
      init_amt: product.init_amt.toNumber(),
      cancelled: product.cancelled,
      rating: product.total_ratings.toNumber(),
      pId: i,
      reviews: product.reviews,
      ratings: product.ratings.map(x => x.toNumber()),
      avg_rating: (
        [product.ratings.map(x => x.toNumber()).reduce((partialSum, a) => partialSum + a, 0)
          /product.total_ratings.toNumber()].map(x => {
          if (isNaN(x))
            return undefined
          else
            return x
        }
      )[0]
      )
    }));
    return parsedProducts;
  }

  const getModProducts = async (buyer_id) => {
    const products = await getProducts();
    const parsedProducts = await Promise.all(products.map(async (product,i) => {
      return {
        seller: product.seller,
        name: product.name,
        description: product.description,
        price: product.price,
        amt: product.amt,
        init_amt: product.init_amt,
        cancelled: product.cancelled,
        rating: product.rating,
        pId: i,
        status: await getStatus(i, buyer_id),
        
      }
  }));
    return parsedProducts;
  }


  const getUserProducts= async (product) => {
    const allProducts = await getProducts();
    const filteredCampaigns = allProducts.filter((product) => product.seller === address);
    return filteredCampaigns;
  }

  const getUserTransactions = async (buyer_id) => {
    const allProducts = await getProducts();
    const parsedProducts = await Promise.all(allProducts.map(async (product,i) => {
      return {
        seller: product.seller,
        name: product.name,
        description: product.description,
        price:product.price,
        amt: product.amt,
        init_amt: product.init_amt,
        cancelled: product.cancelled,
        rating: product.rating,
        pId: i,
        status: await getStatus(i, buyer_id),
        reviews: product.reviews,
        ratings: product.ratings,
        avg_rating: product.avg_rating,
      }
  }));
    const filteredCampaigns = parsedProducts.filter((product) => product.status > 0);
    return filteredCampaigns;
  }


  const buyProduct = async (product_id, delivery_address, deposit) => {
    const data = await contract.call(
      'buyProduct',
      product_id,
      delivery_address,
      { value: ethers.utils.parseUnits(deposit.toString(), "wei")});
    return data;
  }

  // Ongoing
  const observeBuyers = async (product_id) => {
    const products = await contract.call('observeBuyers', product_id);

    return products;
  }


  // // Ongoing
  const approvePurchase = async (product_id, buyer_id) => {
    const data = await contract.call(
      'approvePurchase',
      product_id,
      buyer_id,
    );
    return data;
  }
  // // Ongoing
  const rejectPurchase = async (product_id, buyer_id) => {
    const data = await contract.call(
      'rejectPurchase',
      product_id,
      buyer_id,
    );
    return data;
  }
  // // Ongoing
  const approveReceipt = async (product_id) => {
    const data = await contract.call(
      'approveReceipt',
      product_id,
    );
    return data;
  }
  // // Ongoing
  const cancelBuy = async (product_id) => {
    const data = await contract.call(
      'cancelBuy',
      product_id,
    );
    return data;
  }

  // Finished with Retreive button
  const stopProduct = async (product_id) => {
    const data = await contract.call(
      'stopProduct',
      product_id,
    );

  }
    // Ongoing
    const getDeliveryAddress = async (product_id, buyer_id) => {
      const data = await contract.call(
        'getDeliveryAddress',
        product_id,
        buyer_id,
      );
      return data
    }
  // Ongoing
  const getStatus = async (product_id, buyer_id) => {
    const data = await contract.call(
      'getStatus',
      product_id,
      buyer_id,
    );
    return data;
  }
  
  // Ongoing
  const addRating = async (product_id, rating, review) => {
    const data = await contract.call(
      'addRating',
      product_id,
      rating,
      review,
    );
  }

  return (
    <StateContext.Provider
      value={{
        address,
        contract,
        connect,
        createProduct: publishProduct,
        getProducts,
        getModProducts,
        getUserProducts,
        getUserTransactions,
        buyProduct,
        observeBuyers,
        stopProduct: stopProduct,

        approvePurchase,
        rejectPurchase,
        cancelBuy,
        approveReceipt,
        getStatus,

        getDeliveryAddress,
        addRating: addRating,
      }}
    >
      {children}
    </StateContext.Provider>
  )
}
export const useStateContext = () => useContext(StateContext);
