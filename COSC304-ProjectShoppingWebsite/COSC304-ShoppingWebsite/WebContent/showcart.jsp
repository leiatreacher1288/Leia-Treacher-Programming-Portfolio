<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.text.NumberFormat" %>
<%@ page import="java.util.Map" %>
<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF8"%>
<!DOCTYPE html>
<html>
	
<head>
	<title>Your Shopping Cart</title>
	<%session.setAttribute("form", "showcart.jsp");%>
	<%@ include file="header.jsp"%>	
<style>
input[type=submit2] {
	font-size: 16px;
	width: 150px;
	background-color:rgb(9, 195, 108);
	border: none;
	color: rgb(251, 250, 250);
	padding: 15px 30px;
	cursor: pointer;
	margin-left:30px;
	margin-right:30px;
	text-align: center;
}  
input[type=submit] {
	margin-left:10px;
	margin-right:10px
}
input{
	font-size: 16px;
}
</style>
</head>
<body>
<%
// Get the current list of products
@SuppressWarnings({"unchecked"})
HashMap<String, ArrayList<Object>> productList = (HashMap<String, ArrayList<Object>>) session.getAttribute("productList");
NumberFormat currFormat = NumberFormat.getCurrencyInstance();

// Variable declaration
String str_pId="", str_pName = "", encodedPName="";
int qty = 0, int_size=0, max_qty=0, stock=0;
double pr = 0, total = 0;
Object price;
			
if (productList == null){
%>
	<h1>Your shopping cart is empty!</h1>
<%	
	productList = new HashMap<String, ArrayList<Object>>();
} else {
	Iterator<Map.Entry<String, ArrayList<Object>>> iterator = productList.entrySet().iterator();
	if (productList.size() > 0){
		%>
		<h1>Your Shopping Cart</h1>
		<table><tr><th>Product Id</th><th>Product Name</th><th>Quantity</th>
			<th>Price</th><th>Subtotal</th><th></th><th></th></tr>
		<%
		
		while (iterator.hasNext()) {
			Map.Entry<String, ArrayList<Object>> entry = iterator.next();
			ArrayList<Object> product = (ArrayList<Object>) entry.getValue();
			// the size of the ArrayList is 5
			// id, productName, price, and quantity
			if (product.size() < 5){
				int_size = product.size();
				%>
				<h2>Expected product with five entries. Got: <%=int_size%></h2>
				<%
				continue;
			}
			str_pId = (String)product.get(0);
			str_pName = (String)product.get(1);
			price = product.get(2);
			Object itemqty = product.get(3);
			Object itemstock = product.get(4);
			
			//max_qty = ( (Integer)product.get(4)).intValue();
			
			encodedPName = str_pName.replaceAll(" ","%20");
				
			// Converting a String to Integer for quantity and Double for price.
			// Converting a String to Integer for quantity and Double for price.
			try
			{
				pr = Double.parseDouble(price.toString());
			}
			catch (Exception e)
			{
				out.println("Invalid price for product: "+product.get(0)+" price: "+price);
			}
			try
			{
				qty = Integer.parseInt(itemqty.toString());
			} 
			catch (Exception e)
			{
				out.println("Invalid quantity for product: "+product.get(0)+" quantity: "+itemqty);
			}
			
			try
			{
				stock = Integer.parseInt(itemstock.toString());
			}
			catch (Exception e)
			{
				out.println("Invalid stock for product: "+product.get(0)+" stock: "+itemstock);
			}			
			%>
			<tr><td><%=str_pId%></td>
				<td><%=str_pName%></td>
				<form action="addcart.jsp"  method="get">
					<td><input type="number" min="0" max="<%=stock%>"  value="<%=qty%>" name="new_qty" style="width: 100px"></td>
					<td align="right"><%=currFormat.format(pr)%></td>
					<td align="right"><%=currFormat.format(pr*qty)%></td>
					<input type="hidden" name="id" value="<%=str_pId%>">
					<input type="hidden" name="name" value="<%=str_pName%>">
					<input type="hidden" name="price" value="<%=pr%>">
					<input type="hidden" name="stock" value="<%=stock%>">
					<td><input type="submit" value="Update Quantity"></input></td>
					<td><a href=addcart.jsp?id=<%=str_pId%>&name=<%=encodedPName%>&price=<%=pr%>&new_qty=0>Delete from Cart</a></td></tr>
				</form>
			</tr>
			<%
			total = total +pr*qty;
		}
		String frmt_total = currFormat.format(total);
		%>
		<tr>
			<td colspan="4" align="right"><b>Order Total</b></td>
			<td align="right"><%=frmt_total%></td>
		</tr>
		</table>
		<br>
		<%
		// make sure the user is logged in before checkout
		if (userName == null){ 
			%>
			<h2><a href="login.jsp?form=showcart.jsp">Check Out</a></h2>
		<% }else {%>
			<h2><a href="checkout.jsp">Check Out</a></h2>
		<%}
	} 
	if (productList.size()==0){ 
		// No products shopping cart is empty
		%>
		<h1>Your shopping cart is empty!</h1>
		<%
	}
}
%>
<h2><a href="listprod.jsp">Continue Shopping</a></h2>
		
</body>
</html> 

