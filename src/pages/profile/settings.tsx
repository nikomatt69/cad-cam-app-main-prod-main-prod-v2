import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { DynamicLayout } from 'src/components/dynamic-imports';
import { 
  User, 
  Mail, 
  Key, 
  Upload, 
  Save, 
  AlertTriangle,
  CheckCircle 
} from 'react-feather';
import Loading from '@/src/components/ui/Loading';
import MetaTags from '@/src/components/layout/Metatags';
import useUserProfileStore from '@/src/store/userProfileStore';
import ImageService from '@/src/lib/imageService';
import toast from 'react-hot-toast';
import Layout from '@/src/components/layout/Layout';
import ApiKeyManager from '@/src/components/settings/ApiKeyManager';

interface ProfileSettingsForm {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  profileImage?: File | null;
}

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const { profileImage: storeProfileImage, setProfileImage: setStoreProfileImage } = useUserProfileStore();
  
  const [formData, setFormData] = useState<ProfileSettingsForm>({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileImage: null
  });
  
  const [message, setMessage] = useState<{ 
    type: 'success' | 'error'; 
    text: string 
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load profile image from store or localStorage
  useEffect(() => {
    if (storeProfileImage) {
      setProfileImage(storeProfileImage);
    } else if (session?.user?.email) {
      // Check if image exists in localStorage
      const savedImage = ImageService.getImageFromLocalStorage(session.user.email);
      if (savedImage) {
        setProfileImage(savedImage);
        setStoreProfileImage(savedImage);
      } else if (session?.user?.image) {
        // Use user profile image if available
        setProfileImage(session.user.image);
        setStoreProfileImage(session.user.image);
      }
    }
  }, [session, storeProfileImage, setStoreProfileImage]);

  // Load initial user data
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || ''
      }));
    }
  }, [session]);

  // Handle image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file
    if (!file.type.match('image.*')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Get user ID or email as unique identifier
      const userId = session?.user?.email || 'anonymous-user';
      
      // Save image to localStorage as Base64
      const imageBase64 = await ImageService.saveImageToLocalStorage(file, userId);
      
      setProfileImage(imageBase64);
      setStoreProfileImage(imageBase64);
      
      // Also update form data for server upload
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error during upload:', error);
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle image removal
  const handleRemoveImage = () => {
    // Get user ID or email as unique identifier
    const userId = session?.user?.email || 'anonymous-user';
    
    // Remove image from localStorage
    ImageService.removeImageFromLocalStorage(userId);
    
    setProfileImage(null);
    setStoreProfileImage(null);
    
    // Also update form data
    setFormData(prev => ({
      ...prev,
      profileImage: null
    }));
    
    toast.success('Image removed');
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validate form
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({
        type: 'error', 
        text: 'New passwords do not match'
      });
      setIsLoading(false);
      return;
    }

    try {
      // Prepare form data
      const updateData = new FormData();
      updateData.append('name', formData.name);
      updateData.append('email', formData.email);
      
      // Add password fields if provided
      if (formData.currentPassword) {
        updateData.append('currentPassword', formData.currentPassword);
      }
      if (formData.newPassword) {
        updateData.append('newPassword', formData.newPassword);
      }

      // Add profile image if selected
      if (formData.profileImage) {
        updateData.append('profileImage', formData.profileImage);
      }

      // Send update request
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        body: updateData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile');
      }

      // Update session with new data
      await update({
        name: result.name,
        email: result.email,
        image: result.image
      });

      // Show success message
      setMessage({
        type: 'success', 
        text: 'Profile updated successfully'
      });

      // Reset password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      // Show error message
      setMessage({
        type: 'error', 
        text: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center"><Loading/></div>;
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <>
      <MetaTags
        ogImage="/og-image.png" 
        title="Profile Settings" 
      />
     <Layout>
        <div className="p-6 max-w-4xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
          
          {/* Message Banner */}
          {message && (
            <div 
              className={`mb-6 p-4 rounded-md ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="mr-2" size={20} />
                ) : (
                  <AlertTriangle className="mr-2" size={20} />
                )}
                {message.text}
              </div>
            </div>
          )}
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </button>
                {profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 disabled:opacity-50"
                    disabled={isUploading}
                  >
                    Remove Photo
                  </button>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
            
            {/* Personal Information */}
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Full Name
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="sm:col-span-3">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={formData.email}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              </div>
            </div>
            
            {/* Security Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Change Password</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Leave these fields blank if you don&apos;t want to change your password.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Current Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.newPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-between items-center pt-4">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Save className="animate-spin -ml-1 mr-2 h-5 w-5" aria-hidden="true" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
          
          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* API Key Manager Section */}
          <ApiKeyManager />

        </div>
      </Layout>
    </>
  );
}