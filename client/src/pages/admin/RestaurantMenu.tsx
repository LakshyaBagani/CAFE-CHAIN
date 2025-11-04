import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Utensils, Edit, Trash2, Plus, X, Save, Eye, EyeOff, Upload, ArrowLeft } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  category: string;
  type: string;
  availability: boolean;
}

const RestaurantMenu: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    price: '',
    description: ''
  });
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    name: '',
    price: '',
    description: '',
    type: 'Veg',
    category: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isAddingMenu, setIsAddingMenu] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        // Check if we have cached menu data
        const cacheKey = `menu_${restaurantId}`;
        const cachedMenu = localStorage.getItem(cacheKey);
        const cachedTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
        const cachedVersion = localStorage.getItem(`${cacheKey}_version`);
        
        // If we have cached data, render it immediately
        if (cachedMenu && cachedTimestamp) {
          const menuData = JSON.parse(cachedMenu);
          setMenu(menuData);
          setLoading(false);
          
          // Check menu version in background
          try {
            const versionRes = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/getMenuVersion`, {
              withCredentials: true
            });
            
            const currentVersion = versionRes.data.menuVersion;
            const lastVersion = cachedVersion ? parseInt(cachedVersion) : 0;
            
            // If version hasn't changed, keep using cached data
            if (currentVersion === lastVersion) {
              return;
            }
            
            // Version changed, fetch fresh menu data
            const res = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/menu?t=${Date.now()}`, {
              withCredentials: true,
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (res.data.success) {
              const items: MenuItem[] = res.data.menu.map((m: any) => ({
                id: m.id,
                name: m.name,
                price: m.price,
                description: m.description,
                imageUrl: m.imageUrl,
                category: m.category,
                type: m.type,
                availability: m.availability !== undefined ? m.availability : true
              }));
              
              // Update cache with fresh data
              localStorage.setItem(cacheKey, JSON.stringify(items));
              localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
              localStorage.setItem(`${cacheKey}_version`, currentVersion.toString());
              
              setMenu(items);
            }
          } catch (versionError) {
            // Version check failed, continue with normal fetch
          }
        } else {
          // No cached data, fetch from server
          const res = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/menu?t=${Date.now()}`, {
            withCredentials: true,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (res.data.success) {
            const items: MenuItem[] = res.data.menu.map((m: any) => ({
              id: m.id,
              name: m.name,
              price: m.price,
              description: m.description,
              imageUrl: m.imageUrl,
              category: m.category,
              type: m.type,
              availability: m.availability !== undefined ? m.availability : true
            }));
            
            // Cache the fresh data
            localStorage.setItem(cacheKey, JSON.stringify(items));
            localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
            
            // Get and cache version
            try {
              const versionRes = await axios.get(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/getMenuVersion`, {
                withCredentials: true
              });
              localStorage.setItem(`${cacheKey}_version`, versionRes.data.menuVersion.toString());
            } catch (versionError) {
              // Version check failed, continue with normal fetch
            }
            
            setMenu(items);
          } else {
            setMenu([]);
          }
        }
      } catch (e) {
        setMenu([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [restaurantId]);

  const categorized = useMemo(() => {
    const byCat: Record<string, MenuItem[]> = {};
    for (const item of menu) {
      if (!byCat[item.category]) byCat[item.category] = [];
      byCat[item.category].push(item);
    }
    return byCat;
  }, [menu]);

  const handleDeleteMenu = async (menuId: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    
    try {
      setDeletingId(menuId);
      const response = await axios.delete(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/menu/${menuId}`, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const updatedMenu = menu.filter(item => item.id !== menuId);
        setMenu(updatedMenu);
        
        // Update cache
        const cacheKey = `menu_${restaurantId}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedMenu));
        
        const { showToast } = await import('../../utils/toast');
        showToast('Menu item deleted successfully!', 'success');
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to delete menu item', 'error');
      }
    } catch (error) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to delete menu item', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditMenu = (item: MenuItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      price: item.price.toString(),
      description: item.description
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      setSavingEdit(true);
      const response = await axios.post(`https://cafe-chain.onrender.com/admin/resto/${restaurantId}/editMenu`, {
        menuId: editingId,
        name: editForm.name,
        price: editForm.price,
        description: editForm.description
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        const updatedMenu = menu.map(item => 
          item.id === editingId 
            ? { ...item, name: editForm.name, price: parseFloat(editForm.price), description: editForm.description }
            : item
        );
        setMenu(updatedMenu);
        
        // Update cache
        const cacheKey = `menu_${restaurantId}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedMenu));
        
        setSaveSuccess(true);
        const { showToast } = await import('../../utils/toast');
        showToast('Menu item updated successfully!', 'success');
        setTimeout(() => {
          setEditingId(null);
          setSaveSuccess(false);
        }, 1000);
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to update menu item', 'error');
      }
    } catch (error) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to update menu item', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleAvailability = async (menuId: number, currentStatus: boolean) => {
    try {
      setUpdatingStatus(menuId);
      const newStatus = !currentStatus;
      
      const response = await axios.post('https://cafe-chain.onrender.com/admin/changestatus', {
        restoId: restaurantId,
        menuId: menuId,
        status: newStatus
      }, {
        withCredentials: true
      });
      
      if (response.data.success) {
        // Update the menu state immediately
        const updatedMenu = menu.map(item => 
          item.id === menuId 
            ? { ...item, availability: newStatus }
            : item
        );
        setMenu(updatedMenu);
        
        // Update cache
        const cacheKey = `menu_${restaurantId}`;
        localStorage.setItem(cacheKey, JSON.stringify(updatedMenu));
        
        const { showToast } = await import('../../utils/toast');
        showToast(`Menu item ${newStatus ? 'enabled' : 'disabled'} successfully!`, 'success');
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to update menu status', 'error');
      }
    } catch (error) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to update menu status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleAddMenuItem = async () => {
    if (!selectedImage) {
      const { showToast } = await import('../../utils/toast');
      showToast('Please fill all fields and select an image', 'warning');
      return;
    }

    try {
      setIsAddingMenu(true);
      
      const formData = new FormData();
      formData.append('name', newMenuItem.name);
      formData.append('price', newMenuItem.price);
      formData.append('description', newMenuItem.description);
      formData.append('type', newMenuItem.type);
      formData.append('category', newMenuItem.category);
      formData.append('image', selectedImage);

      const response = await axios.post(
        `https://cafe-chain.onrender.com/admin/resto/${restaurantId}/addMenu`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true
        }
      );

      if (response.data.success) {
        const { showToast } = await import('../../utils/toast');
        showToast('Menu item added successfully!', 'success');
        setShowAddMenuModal(false);
        setNewMenuItem({
          name: '',
          price: '',
          description: '',
          type: 'Veg',
          category: ''
        });
        setSelectedImage(null);
        
        // Refresh the menu data
        const res = await axios.get(`https://cafe-chain.onrender.com/user/resto/${restaurantId}/menu?t=${Date.now()}`, {
          withCredentials: true,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (res.data.success) {
          const items: MenuItem[] = res.data.menu.map((m: any) => ({
            id: m.id,
            name: m.name,
            price: m.price,
            description: m.description,
            imageUrl: m.imageUrl,
            category: m.category,
            type: m.type,
            availability: m.availability !== undefined ? m.availability : true
          }));
          
          setMenu(items);
          
          // Update cache
          const cacheKey = `menu_${restaurantId}`;
          localStorage.setItem(cacheKey, JSON.stringify(items));
          localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
        }
      } else {
        const { showToast } = await import('../../utils/toast');
        showToast('Failed to add menu item', 'error');
      }
    } catch (error: any) {
      const { showToast } = await import('../../utils/toast');
      showToast('Failed to add menu item', 'error');
    } finally {
      setIsAddingMenu(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                to={`/admin/restaurants`}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                aria-label="Back to Orders"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Menu Management
                </h1>
                <p className="text-gray-600 mt-1">Manage your restaurant's menu items</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu items..."
                  className="w-80 pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-gray-50 transition-all duration-200 hover:bg-white"
                />
              </div>
              <button
                onClick={() => setShowAddMenuModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="h-5 w-5" />
                <span>Add Menu Item</span>
              </button>
            </div>
          </div>
        </div>

        {Object.keys(categorized).length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-gray-400 mb-4">
              <Utensils className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No menu items found</h3>
            <p className="text-gray-500">Start by adding your first menu item</p>
          </div>
        )}

        <div className="space-y-12">
          {Object.entries(categorized).map(([category, items]) => {
            const filtered = items.filter(i =>
              i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              i.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (filtered.length === 0) return null;
            return (
              <div key={category} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                    <Utensils className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{category}</h2>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                    {filtered.length} items
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtered.map(item => (
                  <div key={item.id} className={`group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${!item.availability ? 'opacity-75' : ''}`}>
                    <div className="relative">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://via.placeholder.com/320x192?text=No+Image';
                      }} />
                      <div className="absolute top-3 right-3 flex flex-col space-y-2 z-10">
                        <button
                          onClick={() => handleEditMenu(item)}
                          className="p-2.5 bg-white/95 hover:bg-white active:bg-blue-50 rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 hover:shadow-xl backdrop-blur-sm"
                          title="Edit menu item - Click to modify name, price, and description"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenu(item.id)}
                          disabled={deletingId === item.id}
                          className="p-2.5 bg-white/95 hover:bg-white active:bg-red-50 rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 hover:shadow-xl disabled:opacity-50 disabled:transform-none backdrop-blur-sm"
                          title="Delete menu item - Permanently remove this item from the menu"
                        >
                          {deletingId === item.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(item.id, item.availability)}
                          disabled={updatingStatus === item.id}
                          className={`p-2.5 rounded-xl shadow-lg transition-all duration-200 transform active:scale-95 hover:shadow-xl disabled:opacity-50 disabled:transform-none backdrop-blur-sm ${
                            item.availability 
                              ? 'bg-white/95 hover:bg-white active:bg-green-50' 
                              : 'bg-red-100/95 hover:bg-red-200 active:bg-red-300'
                          }`}
                          title={item.availability ? "Disable item - Hide this item from customers" : "Enable item - Show this item to customers"}
                        >
                          {updatingStatus === item.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          ) : item.availability ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-red-600" />
                          )}
                        </button>
                      </div>
                      {!item.availability && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            Unavailable
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      {editingId === item.id ? (
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-gray-50 transition-all duration-200"
                            placeholder="Item name"
                          />
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-gray-50 transition-all duration-200"
                            placeholder="Price"
                          />
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm bg-gray-50 transition-all duration-200"
                            placeholder="Description"
                            rows={2}
                          />
                          <div className="flex space-x-3">
                            <button
                              onClick={handleSaveEdit}
                              disabled={savingEdit}
                              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm transition-all duration-200 transform active:scale-95 disabled:transform-none shadow-lg hover:shadow-xl ${
                                saveSuccess 
                                  ? 'bg-green-600 text-white animate-pulse' 
                                  : 'bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white'
                              }`}
                              title="Save changes to this menu item"
                            >
                              {savingEdit ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : saveSuccess ? (
                                <div className="h-4 w-4 bg-white rounded-full flex items-center justify-center">
                                  <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                                </div>
                              ) : (
                                <Save className="h-4 w-4" />
                              )}
                              <span className="font-medium">{savingEdit ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}</span>
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 flex items-center justify-center space-x-2 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white px-4 py-3 rounded-xl text-sm transition-all duration-200 transform active:scale-95 shadow-lg hover:shadow-xl"
                              title="Cancel editing and discard changes"
                            >
                              <X className="h-4 w-4" />
                              <span className="font-medium">Cancel</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{item.name}</h3>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                              item.type === 'Veg' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {item.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">₹{item.price}</span>
                            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{item.category}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Add Menu Item Modal */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Menu Item
              </h3>
              <button
                onClick={() => setShowAddMenuModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddMenuItem(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  value={newMenuItem.name}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter item name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={newMenuItem.price}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter price"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newMenuItem.description}
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Enter item description"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newMenuItem.type}
                    onChange={(e) => setNewMenuItem(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newMenuItem.category}
                    onChange={(e) => setNewMenuItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Roll">Roll</option>
                    <option value="Burger">Burger</option>
                    <option value="Sandwich">Sandwich</option>
                    <option value="Omelette">Omelette</option>
                    <option value="Maggie">Maggie</option>
                    <option value="Mocktail">Mocktail</option>
                    <option value="Fries">Fries</option>
                    <option value="Drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                  <div className="space-y-1 text-center">
                    {selectedImage ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={URL.createObjectURL(selectedImage)}
                          alt="Preview"
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                        <p className="text-sm text-gray-600 mt-2">{selectedImage.name}</p>
                        <button
                          type="button"
                          onClick={() => setSelectedImage(null)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer bg-white rounded-md font-medium text-amber-600 hover:text-amber-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-amber-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setSelectedImage(e.target.files[0]);
                                }
                              }}
                              required
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingMenu}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                >
                  {isAddingMenu ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="h-4 w-4" />
                      <span>Add Menu Item</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantMenu;


