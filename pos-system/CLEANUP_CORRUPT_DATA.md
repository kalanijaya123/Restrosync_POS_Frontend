# Clean Up Corrupt Menu Items

## Issue
A menu item with null values was created (ID: `693c5ec3fb60f2bc87f798eb`)

## Fix Applied
✅ **Updated MenuManager validation** to prevent null values
✅ **Updated NotificationContext** to use environment variable API URL

## To Delete Corrupt Item

### Option 1: Using Browser Console
Open your app, go to Menu Manager page, and run in console:
```javascript
fetch('http://localhost:8080/api/menu/693c5ec3fb60f2bc87f798eb', { 
    method: 'DELETE' 
})
.then(() => console.log('Deleted!'))
.then(() => window.location.reload())
```

### Option 2: Using Backend/Database Directly
If you have access to your MongoDB:
```javascript
db.menuitems.deleteOne({ _id: ObjectId("693c5ec3fb60f2bc87f798eb") })
```

### Option 3: From Menu Manager UI
1. Go to Menu Manager page
2. Find the item with no name (should show at the bottom)
3. Click the Delete button

## Backend 500 Error Fix

The `/api/orders/recent` endpoint is returning 500. Check your backend:

1. **Make sure the endpoint exists** in your backend
2. **Check backend logs** for the exact error
3. **Verify database connection** is working

If the endpoint doesn't exist yet, you can temporarily disable notifications:
```typescript
// In NotificationContext.tsx, comment out the polling:
// const checkForNewOrders = async () => { ... }
```

## Prevention
The updated validation now checks:
- ✅ Name is not empty
- ✅ Category is selected and not empty  
- ✅ At least one size has both name AND price
- ✅ Sizes are filtered to only valid entries
- ✅ Empty arrays default properly
