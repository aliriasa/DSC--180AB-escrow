
//  SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.2;
 
contract Store {

    struct Product {
        string name;
        string description;
        
        uint init_amt;
        uint amt;
        uint price;
        uint value_escrow;

        bool cancelled;

        uint deposit_fund;
        
        mapping (address => bool) buyer_start;
        mapping (address => bool) buyer_confirmations;
        mapping (address => bool) past_buyers;
        mapping (address => bool) past_rejects;

        address[] buyer_ids;

        address seller;

        uint rating;
        uint tot_ratings;
        string[] reviews;
        mapping (string => uint) rating_review;
    }

    uint public numProducts = 0;
    mapping(uint => Product) public products;

    // Seller: Create a new product for sale
    function createProduct (
        address _seller,
        string calldata name,
        string calldata description,
        uint price,
        uint amt
    ) public payable {
        // Ensure that the seller has enough balance to sell
        require(address(msg.sender).balance > price, "Not enough balance to sell");
        // Ensure that the value sent is equal to the price
        require(msg.value == price, "Value must be equal to price");

        // Create a new product
        uint256 idx = numProducts;
        numProducts++;
        Product storage newProduct = products[idx];

        // Add information about the new product
        newProduct.seller = _seller;
        newProduct.name = name;
        newProduct.description = description;
        newProduct.price = price;
        newProduct.value_escrow = price * 2;
        newProduct.deposit_fund = price;        
        newProduct.amt = amt;
        newProduct.init_amt = amt;
        newProduct.seller = address(msg.sender);
        newProduct.cancelled = false;
    
    }
    function getProducts() public view returns (Product[] memory) {
        Product[] memory allProducts = new Product[](numProducts);
        for(uint i = 0; i < numProducts; i++) {
            Product storage item = products[i];
            allProducts[i] = item;
        }

        return allProducts;
    }
    // Buyer: Buy a product
    function buyProduct(
        uint product_id
    ) public payable {
        // Select a product to buy
        Product storage curProd = products[product_id];

        // Ensure that the buyer has enough balance to buy the product
        require(address(msg.sender).balance > curProd.value_escrow, "Not enough balance to buy");
        // Ensure that the value sent is equal to the value of the escrow
        require(msg.value == curProd.value_escrow, "Value must be equal to the value of the escrow");
        // Ensure that the product is still available
        require(curProd.amt > 0, "Product is out of stock");
        // Ensure that the buyer has not already been rejected
        require(!curProd.past_rejects[msg.sender], "Buyer has already been rejected");
        // Ensure that the buyer has not already bought the product
        require(!curProd.past_buyers[msg.sender], "Buyer has already bought the product");
        // Ensure that the buyer has not already started the transaction
        require(!curProd.buyer_start[msg.sender], "Buyer can only buy one item of the product");

        // Increase the deposit fund
        curProd.deposit_fund += msg.value;

        // Set the buyer's start transaction to true
        curProd.buyer_start[address(msg.sender)] = true;    
        // Set the buyer's confirmation to false
        curProd.buyer_confirmations[address(msg.sender)] = false;      
        
        // Decrease the amount of the product available
        curProd.amt --;
        // Add the buyer's address to the buyer_ids array
        curProd.buyer_ids.push(address(msg.sender));
    }

    // Seller: Approve purchase for the specified buyer
    function approvePurchase(
        uint product_id,
        address payable buyer_id
    ) public {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];

        // Ensure that only the seller can approve the purchase
        require(curProd.seller == address(msg.sender), "Only the seller can approve the purchase.");
        // Ensure that the buyer has not already been rejected or already purchased the product
        require(!curProd.past_rejects[buyer_id], "The buyer has already been rejected.");
        require(!curProd.past_buyers[buyer_id], "The buyer has already purchased the product.");
        // Ensure that the buyer has already started the transaction
        require(curProd.buyer_start[buyer_id], "The buyer has not started the transaction");
        // Ensure that the seller has not already approved Purchase
        require(!curProd.buyer_confirmations[buyer_id], "The buyer has already been approved");

        // Approve the purchase by setting the buyer's confirmation status to true
        curProd.buyer_confirmations[buyer_id] = true;
    }

    // Seller: Reject a purchase from the specified buyer
    function rejectPurchase(
        uint product_id,
        address payable buyer_id
    ) public {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];

        // Ensure that only the seller can reject the purchase
        require(curProd.seller == address(msg.sender), "Only the seller can reject the purchase.");
        // Ensure that the buyer has not already been rejected or already purchased the product
        require(!curProd.past_rejects[buyer_id], "The buyer has already been rejected.");
        require(!curProd.past_buyers[buyer_id], "The buyer has already purchased the product.");

        // Transfer the escrowed funds back to the buyer
        payable(address(buyer_id)).transfer(curProd.value_escrow);
        
        // Increment the number of avaiable products
        curProd.amt ++;
        // Decrement the deposit fund for the product
        curProd.deposit_fund -= curProd.value_escrow;
        // Record the rejection for the buyer
        curProd.past_rejects[buyer_id] = true;
        curProd.buyer_confirmations[buyer_id] = true;
    }

    // Buyer: Approve receipt of the specified product
    function approveReceipt(
        uint product_id
    ) public {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];
        // Ensure that the buyer has confirmed the purchase with the seller
        require(curProd.buyer_confirmations[address(msg.sender)], "The seller has not confirmed the purchase.");
        // Ensure that the buyer has not already purchased the product
        require(!curProd.past_buyers[address(msg.sender)], "The buyer has already purchased the product.");
        // Ensure that the buyer has not been rejected
        require(!curProd.past_rejects[address(msg.sender)], "The buyer has already been rejected.");
        
        // Transfer the price of the product to the buyer
        payable(address(msg.sender)).transfer(curProd.price);
        // Transfer the price of the product to the seller
        payable(curProd.seller).transfer(curProd.price);

        // Reduce the deposit fund by the escrow value
        curProd.deposit_fund -= curProd.value_escrow;
        
        // Mark the buyer as having purchased the product
        curProd.past_buyers[address(msg.sender)] = true;

        // If the amount of available products is 0, transfer the price to the seller
        if (curProd.amt == 0 && !curProd.cancelled) {
            payable(curProd.seller).transfer(curProd.price);
            curProd.deposit_fund -= curProd.price;
            curProd.cancelled = true;
        }
    }

    // Buyer: Reject receipt of the specified product
    function rejectReceipt(
        uint product_id
    ) public {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];

        // Ensure that the buyer has not already purchased the product and has not been rejected
        require(!curProd.past_buyers[address(msg.sender)], "The buyer has already purchased the product.");
        require(!curProd.past_rejects[address(msg.sender)], "The buyer has already been rejected.");

        // Transfer the escrow value back to the buyer
        payable(address(msg.sender)).transfer(curProd.value_escrow);

        // Decrement the deposit fund by the escrow value
        curProd.deposit_fund -= curProd.value_escrow;

        // Mark the buyer as having rejected the product
        curProd.past_rejects[msg.sender] = true;
        curProd.buyer_confirmations[msg.sender] = true;

        if (!curProd.cancelled) {
            // Increment the amount of available products
            curProd.amt ++;
        }
    }

    // Seller: stop selling Product
    function stopProduct(
        uint product_id
    ) public {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];

        // Ensure that only the seller can delete the product
        require(curProd.seller == address(msg.sender), "Only the seller can stop the purchase.");
        
        // Mark the product as cancelled
        curProd.cancelled = true;
        // Reset the product's amount
        curProd.amt = 0;

        for (uint i = 0; i < curProd.buyer_ids.length; i++) {
            // Check if the buyer's confirmation is true
            if (!curProd.buyer_confirmations[curProd.buyer_ids[i]]) {
                // Transfer the buyer's escrow value back to them
                payable(curProd.buyer_ids[i]).transfer(curProd.value_escrow);
                // Decrement the deposit fund by the escrow value
                curProd.deposit_fund -= curProd.value_escrow;
            }
        }
        // Transfer the sellers's escrow price back to them
        payable(curProd.seller).transfer(curProd.price);
        // Decrement the deposit fund by the product price
        curProd.deposit_fund -= curProd.price;
    }

    // Seller: observe Buyers
    function observeBuyers(
        uint product_id
    ) public view returns (address[] memory) {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];

        // Ensure that the caller is the seller of the product
        require(curProd.seller == address(msg.sender), "The caller must be the seller of the product.");
        
        // Return the list of buyers for the specified product
        return curProd.buyer_ids;
    }   

    // Buyer: Add rating to product
    function addRating(
        uint product_id, 
        uint rating, 
        string calldata review
    ) public {
        // Retrieve the specified product from storage
        Product storage curProd = products[product_id];
        
        // Ensure that the message sender is not the seller of the product
        require(curProd.seller != address(msg.sender), "The seller cannot add a rating.");
        // Ensure that the message sender has confirmed the receipt for the product
        require(curProd.buyer_confirmations[address(msg.sender)], "You did not buy the product to review");
        // Ensure that the rating provided is between 0 and 5
        require(rating <= 5, "The rating should be between 0 and 5");
        
        // Add the review and rating to the product's storage
        curProd.tot_ratings ++;
        curProd.reviews.push(review);
        curProd.rating_review[review] = rating;
        curProd.rating += ((curProd.rating*(curProd.tot_ratings-1))+(rating))/curProd.tot_ratings;    
    }

}