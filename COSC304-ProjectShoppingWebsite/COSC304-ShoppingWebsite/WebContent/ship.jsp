<%@ page import="java.sql.*" %>
<%@ page import="java.text.NumberFormat" %>
<%@ page import="java.util.HashMap" %>
<%@ page import="java.util.Iterator" %>
<%@ page import="java.util.ArrayList" %>
<%@ page import="java.util.Map" %>
<%@ page import="java.util.Date" %>
<%@ page import="java.text.DateFormat" %>
<%@ page import="java.util.TimeZone" %>
<%@ page import="java.text.SimpleDateFormat" %>
<%@ include file="jdbc.jsp" %>

<html>
<head>
	<%session.setAttribute("form", "ship.jsp");%>
    <%@ include file="header.jsp" %>
<title>YOUR NAME Grocery Shipment Processing</title>
</head>
<body>    


<%

StringBuilder content = new StringBuilder();   
// TODO: Get order id          
// TODO: Check if valid order id in database
String orderid = request.getParameter("orderId");
String sql = "SELECT orderId FROM dbo.ordersummary  where orderId = ?";
String sql2 = "SELECT op.productId, op.quantity, inv.quantity, inv.warehouseId " +
				"from [dbo].[orderproduct] op " +  
				"inner join dbo.productinventory inv on op.productId = inv.productId " + 
				"where op.orderId = ? " ;
				
String sql3 = "insert into dbo.shipment(shipmentDate, shipmentDesc, warehouseId) values(?,?,?)";
String sql4 = "update dbo.productinventory set quantity = ? where productId = ?";
String sql5 = "select * from dbo.shipment where shipmentDesc = ? and warehouseId =? ";
boolean successflag = true;

Date date = new Date();
DateFormat df = new SimpleDateFormat("yyyy-MM-dd");
df.setTimeZone(TimeZone.getTimeZone("PST"));				
String shipdate = df.format(date);	
PreparedStatement pst = null;
PreparedStatement pst2 = null;
PreparedStatement pst3 = null;
PreparedStatement pst4 = null;
PreparedStatement pst5 = null;
ResultSet rs =null;   
ResultSet rs2 =null;    
ResultSet rs3 =null;

try ( Connection con = DriverManager.getConnection(url, uid, pw) )
		{			
			pst = con.prepareStatement(sql);     		
   			pst.setString(1, orderid);   		
    		rs = pst.executeQuery();   

		    if(rs.next()) {				
				// TODO: Start a transaction (turn-off auto-commit)	
				con.setAutoCommit(false);				
				// TODO: Create a new shipment record.
				
				
				// TODO: Retrieve all items in order with given id
				pst2 = con.prepareStatement(sql2);     		
   			    pst2.setString(1, orderid);  
				rs2 = pst2.executeQuery();  
				while (rs2.next()) {
					String productid = rs2.getString(1);
					int qty = rs2.getInt(2);
					int inv = rs2.getInt(3);
					int warid = rs2.getInt(4);						
				//out.println(shipdate);
				String orderdescript = orderid;			
									

					// TODO: For each item verify sufficient quantity available in the warehouse
					if (qty <= inv) {
						int rem = inv - qty;
						pst4 = con.prepareStatement(sql4, ResultSet.CONCUR_UPDATABLE); 
						pst4.setInt(1, rem); 
						pst4.setString(2, productid);
						pst4.executeUpdate();
						content.append("<h3> Ordered product: " + productid + 
								 	" Qty: " + qty + " Previous Inventory: " + inv + 
									" New Inventory: " + rem + "</h3>");	
						
						//check if a shipment for that order from that warehouse already exists
						pst5 = con.prepareStatement(sql5);
						pst5.setString(1, orderdescript);
						pst5.setInt(2, warid);
						rs3 = pst5.executeQuery();
						if(!rs3.next()) {
							//if shipment does not exist, then create a new shipment record
						pst3 = con.prepareStatement(sql3, ResultSet.CONCUR_UPDATABLE);
						pst3.setString(1, shipdate);
						pst3.setString(2, orderdescript);
						pst3.setInt(3, warid);	
						pst3.executeUpdate();		
						}					
						
					}else {
						// TODO: If any item does not have sufficient inventory, cancel transaction and rollback.
						con.rollback();
						content.append("<h2>Shipment not done. Insufficient inventory for product id: " + productid + "</h2>");
						successflag = false;
						break;
					}		
					
				}
				con.commit();	
				if(successflag) {content.append("<h2>Shipment successfully processed. </h2>");	}
			}		

		}catch (SQLException ex) {
			out.println(ex);
		}
		finally
		{
			closeConnection();
		}	
				
		out.println(content);

		
	
	
	// TODO: If any item does not have sufficient inventory, cancel transaction and rollback. Otherwise, update inventory for each item.
	
	// TODO: Auto-commit should be turned back on
	
	
	
%>                       				

<div class = 'crumb'>
<a href="admin.jsp">Back to Admin Portal</a>
</div>

</body>
</html>
