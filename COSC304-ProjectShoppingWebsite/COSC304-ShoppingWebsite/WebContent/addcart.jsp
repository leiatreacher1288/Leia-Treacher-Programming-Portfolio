<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.ArrayList" %>
<%
// Get the current list of products
@SuppressWarnings({"unchecked"})
HashMap<String, ArrayList<Object>> productList = (HashMap<String, ArrayList<Object>>) session.getAttribute("productList");

if (productList == null)
{	// No products currently in list.  Create a list.
	productList = new HashMap<String, ArrayList<Object>>();
}

// Add new product selected
// Get product information
String new_quantity = null;
Integer quantity = null;
Integer int_Stock = null;

String id = request.getParameter("id");
String name = request.getParameter("name");
String price = request.getParameter("price");
String stock = request.getParameter("stock");
new_quantity = request.getParameter("new_qty");

// If new_quantity is null, we assume it is a new product
// added to the cart.  If it is not null then it was
// call with Update Quantity button
if (new_quantity==null)
	quantity = 1;
else
	try{
		// check if new quantity is a number 
		quantity = Integer.parseInt(new_quantity.toString());
	} catch (Exception e){
		// the quantity entered is not a number set quantity to -1
		quantity = -1;
	}

	// check if stock is a number 
	try{
		// check if new quantity is a number 
		int_Stock = Integer.parseInt(stock.toString());
	} catch (Exception e){
		// set Stock to zero
		int_Stock = 0;;
	}
	//int_Stock = Integer.parseInt(stock.toString());


// if new_quantity is 0 then delete the product from the cart
if (quantity == 0 ){
	try{
		productList.remove(id);
	} catch (Exception e){
		// ignore Exception
	}

} else if (quantity > -1) {
	// Store product information in an ArrayList
	ArrayList<Object> product = new ArrayList<Object>();
	product.add(id);
	product.add(name);
	product.add(price);
	product.add(quantity);
	product.add(int_Stock);

	// Update quantity if add same item to order again
	if (productList.containsKey(id) && new_quantity==null)
	{	product = (ArrayList<Object>) productList.get(id);
		int curAmount = ((Integer) product.get(3)).intValue();
		product.set(3, new Integer(curAmount+1));
	}
	else
		productList.put(id,product);
}
// save productList so other jsp can use it
session.setAttribute("productList", productList);
%>
<jsp:forward page="showcart.jsp" />