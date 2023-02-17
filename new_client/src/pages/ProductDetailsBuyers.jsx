import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import useFetch from "../hooks/gifGen";

import { useStateContext } from '../context';
import { CountBox, CustomButton, Loader, FormField } from '../components';
import { calculateBarPercentage, daysLeft } from '../utils';

const ProductDetailsBuyers = () => {
  const { state } = useLocation();

  const keyword = state.name;
  const gifUrl = useFetch({ keyword });
  const navigate = useNavigate();
  const {buyProduct,  contract, address } = useStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [delivery_address, setDelivery_address] = useState('');
  const [form, setForm] = useState({
    rate: '',
    review: '',
  });

  const fetchDonators = async () => {
      // const data = await getDonations(state.pId);
  
      // setDonators(data);
    }    
    useEffect(() => {
      if(contract) fetchDonators();
    }, [contract, address])
  
    const handleBuy = async () => {
      setIsLoading(true);
      await buyProduct(
        state.pId,
        delivery_address,
        ethers.utils.parseUnits(parseFloat(state.price*2).toString(), "ether")
      ); 
      setIsLoading(false);
    }

    const handleRating = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      await addRating(
        {...form,}
      ); 
      setIsLoading(false);
    }


  return (
      <div>
      {isLoading && <Loader />}

      <div className="w-full flex md:flex-row flex-col mt-5 gap-[15px]">
        <div className="flex-1 flex-col">
          <img src={gifUrl} alt="product" className="w-11/12 h-[500px] object-cover rounded-xl"/>
          <div className="relative w-11/12  h-[5px] bg-[#3a3a43] mt-2">
            <div className="absolute h-full bg-[#4acd8d]" 
            style={{ width: `${calculateBarPercentage(state.init_amt, state.amt)}%`,
              maxWidth: '100%'}}>
            </div>
          </div>
        </div>

        <div className="flex md:w-[250px] w-full flex-wrap justify-between gap-[20px]">
          <CountBox title={`Price in ETH`} value={state.price} />
          <CountBox title={`Initial amount of ${state.init_amt}`} value={state.amt} />
          <CountBox title={`Out of 5 Stars`} value={state.rating} />
        </div>
      </div>

      <div className="mt-[60px] flex lg:flex-row flex-col gap-5">
        <div className="flex-[2] flex flex-col gap-[40px]">
          <div>
            <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">
              Seller
            </h4>

            <div className="mt-[20px] flex flex-row items-center flex-wrap gap-[14px]">
              <div className="w-[52px] h-[52px] flex items-center justify-center rounded-full bg-[#2c2f32] cursor-pointer">
                <img src="https://www.shutterstock.com/image-photo/seller-apron-market-260nw-720760306.jpg" alt="user" className="w-[60%] h-[60%] object-contain"/>
              </div>
              <div>
                <h4 className="font-epilogue font-semibold text-[14px] text-white break-all">{state.seller}</h4>
                <p className="mt-[4px] font-epilogue font-normal text-[12px] text-[#808191]"> Products</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-epilogue font-semibold text-[25px] text-white uppercase">Description</h4>

              <div className="mt-[20px]">
                <p className="font-epilogue font-normal text-[20px] text-[#808191] leading-[26px] text-justify">{state.description}</p>
              </div>
          </div>

          <div className="flex-1">
          <h4 className="font-epilogue font-semibold text-[18px] text-white uppercase">Shop</h4>   


        {state.status == 0 && (
        <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
          <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
            Buy this product
          </p>
          {state.amt != 0 && (
            <div className="mt-[30px]">
              <input 
                type="text"
                placeholder="Your address"
                step="0.01"
                className="w-full py-[10px] sm:px-[20px] px-[15px] outline-none border-[1px] border-[#3a3a43] bg-transparent font-epilogue text-white text-[18px] leading-[30px] placeholder:text-[#4b5264] rounded-[10px]"
                value={delivery_address}
                onChange={(e) => setDelivery_address(e.target.value)}
              />

              <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">Enjoy what you love</h4>
                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-[#808191]">You will have to deposit twice the price</p>
              </div>

              <CustomButton 
                btnType="button"
                title="Buy Product"
                styles="w-full bg-[#8c6dfd]"
                handleClick={handleBuy}
              />
            </div>             

            )}
            {state.amt === 0 && (
              <h1 className="font-epilogue font-semibold text-[20px] leading-[22px] text-white">Products ran out</h1>
            )}
        </div>)}
        
        {state.status === 4 && (
        <form onSubmit={handleRating} className="w-full mt-[65px] flex flex-col gap-[30px]">
        <div className="mt-[20px] flex flex-col p-4 bg-[#1c1c24] rounded-[10px]">
          <p className="font-epilogue fount-medium text-[20px] leading-[30px] text-center text-[#808191]">
            Rate this product
          </p>
          {state.amt != 0 && (
            <div className="mt-[30px]">
                  <FormField 
                      labelName="Rating *"
                      placeholder="out of 5"
                      inputType="number"
                      value={form.amt}
                      handleChange={(e) => handleFormFieldChange('amt', e)}
                  />
                  <FormField 
                  labelName="Review *"
                  placeholder="Product Review "
                  isTextArea
                  value={form.review}
                  handleChange={(e) => handleFormFieldChange('description', e)}
                  />
              <div className="my-[20px] p-4 bg-[#13131a] rounded-[10px]">
                <h4 className="font-epilogue font-semibold text-[14px] leading-[22px] text-white">Enjoy what you love</h4>
                <p className="mt-[20px] font-epilogue font-normal leading-[22px] text-[#808191]">Feedback is important to us</p>
              </div>

              <CustomButton 
                btnType="button"
                title="Rate it"
                styles="w-full bg-[#8c6dfd]"

              />
            </div>             

            )}
            {state.amt === 0 && (
              <h1 className="font-epilogue font-semibold text-[20px] leading-[22px] text-white">Products ran out</h1>
            )}
        </div>
        </form>
        )}

        </div> 
        </div>
      </div>
    </div>        
  )
}

export default ProductDetailsBuyers