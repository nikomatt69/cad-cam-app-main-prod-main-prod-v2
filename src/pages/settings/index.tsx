import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import useUserProfileStore from 'src/store/userProfileStore';
import ImageService from 'src/lib/imageService';
import { User, Shield, Bell, Globe, Monitor, Key, Tag, HelpCircle, Cpu } from 'react-feather';
import EnhancedLayout from 'src/components/layout/Layout';
import MetaTags from 'src/components/layout/Metatags';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { AISettingsPanel } from '@/src/components/ai/ai-new';
import SubscriptionSettings from '@/src/components/subscription/SubscriptionSettings';
import SubscriptionSettingsPage from './subscription';
import ProfileSettingsPage from '../profile/settings';
import { SubscriptionProvider } from '@/src/contexts/SubscriptionContext';

export default function Settings() {


  // Funzioni per la gestione dell'immagine del profilo
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validazione del file
    if (!file.type.match('image.*')) {
      toast.error('Per favore seleziona un file immagine valido');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Ottieni l'ID utente o email come identificatore univoco
      const userId = session?.user?.email || 'anonymous-user';
      
      // Salva l'immagine nel localStorage come Base64
      const imageBase64 = await ImageService.saveImageToLocalStorage(file, userId);
      
      setProfileImage(imageBase64);
      setStoreProfileImage(imageBase64);
      
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Errore durante il caricamento:', error);
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveImage = () => {
    // Ottieni l'ID utente o email come identificatore univoco
    const userId = session?.user?.email || 'anonymous-user';
    
    // Rimuovi l'immagine dal localStorage
    ImageService.removeImageFromLocalStorage(userId);
    
    setProfileImage(null);
    setStoreProfileImage(null);
    toast.success('Image removed');
  };
  
  
  // Funzione che simula un caricamento su server
  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  };
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Accesso allo store globale per la condivisione dell'immagine profilo
  const { profileImage: storeProfileImage, setProfileImage: setStoreProfileImage } = useUserProfileStore();
  
  // Deletion State
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Account Deletion Handler
  const handleDeleteAccount = async () => {
    setDeleteError(null);

    // Confirmation dialog
    if (!window.confirm('Are you sure you want to delete your account? This action is irreversible and all your data will be lost.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
      });

      if (!response.ok) {
        let errorData;
        try {
           errorData = await response.json();
        } catch (jsonError) {
            // Handle cases where the response is not valid JSON
            throw new Error(response.statusText || 'Failed to delete account. Server returned an invalid response.');
        }
        throw new Error(errorData.message || 'Failed to delete account');
      }

      // Account deleted successfully
      toast.success("Account deleted successfully.");

      // Sign out and redirect
      await signOut({ redirect: false, callbackUrl: '/' });
      router.push('/'); // Redirect to home page

    } catch (error) {
      console.error('Account deletion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during deletion.';
      setDeleteError(`Account Deletion Error: ${errorMessage}`);
      toast.error(`Account Deletion Error: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Inizializza l'immagine profilo dallo store o dal localStorage
  useEffect(() => {
    if (storeProfileImage) {
      setProfileImage(storeProfileImage);
    } else if (session?.user?.email) {
      // Controlla se esiste un'immagine nel localStorage
      const savedImage = ImageService.getImageFromLocalStorage(session.user.email);
      if (savedImage) {
        setProfileImage(savedImage);
        setStoreProfileImage(savedImage);
      } else if (session?.user?.image) {
        // Usa l'immagine dal profilo dell'utente se disponibile
        setProfileImage(session.user.image);
        setStoreProfileImage(session.user.image);
      }
    }
  }, [session, storeProfileImage, setStoreProfileImage]);

  // Se l'utente non è autenticato, viene reindirizzato alla pagina di login
  if (status === 'loading') {
    return (
      <EnhancedLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </EnhancedLayout>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signup');
    return null;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User size={18} /> },
    { id: 'account', name: 'Account', icon: <Shield size={18} /> },
    { id: 'billing', name: 'Subscription', icon: <Tag size={18} /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={18} /> },
    { id: 'ai', name: 'AI', icon: <Cpu size={18} /> },
    { id: 'language', name: 'Language', icon: <Globe size={18} /> },
   
   
   
  ];
  
  // Mobile tabs - show only the most important ones on small screens
  const mobileTabs = tabs.slice(0, 4);

  return (
    <EnhancedLayout>
      <MetaTags
  ogImage="/og-image.png" 
        title="Settings" 
      />

      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your profile, account, and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow flex-1 rounded-lg overflow-hidden">
        {/* Tabs - Desktop */}
        <div className="hidden sm:block bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8 text-center overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-4 flex-1 text-center px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                  `}
                >
                  <div className="flex items-center">
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tabs - Mobile */}
        <div className="sm:hidden bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="px-2">
            <div className="flex justify-between overflow-x-auto py-1">
              {mobileTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex flex-col items-center py-2 px-3 text-xs font-medium
                    ${activeTab === tab.id 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400'}
                  `}
                >
                  <span className="mb-1">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
              
              {/* Dropdown for more tabs on mobile */}
              <div className="relative group">
                <button className="flex flex-col items-center py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <span className="mb-1">•••</span>
                  More
                </button>
                <div className="hidden group-hover:block absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10">
                  {tabs.slice(4).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Profile Information</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This information will be displayed publicly, so be careful what you share.
                </p>
              </div>

              <div className=" flex flex-col grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="col-span-full sm:col-span-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      defaultValue={session?.user?.name || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 bg-white text-gray-900 rounded-md"
                    />
                  </div>
                </div>

                <div className="col-span-full sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      name="email"
                      id="email"
                      defaultValue={session?.user?.email || ''}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed"
                      disabled
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>

                <div className="col-span-full">
                  <label htmlFor="about" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bio
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="about"
                      name="about"
                      rows={4}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 bg-white text-gray-900 rounded-md placeholder-gray-400"
                      placeholder="Briefly describe yourself and your experience"
                    ></textarea>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Brief description of your skills and interests.
                  </p>
                </div>

                <div className="col-span-full">
                  <label htmlFor="photo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Photo
                  </label>
                  <div className="mt-1 flex flex-col sm:flex-row items-start sm:items-center">
                    <div className="relative group">
                      <span className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                        {isUploading ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                          </div>
                        ) : null}
                        {profileImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={profileImage} 
                            alt="Profile" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <svg className="h-full w-full text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                      </span>
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                           onClick={() => fileInputRef.current?.click()}>
                        <div className="text-white text-xs font-medium">Change photo</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 sm:mt-0 sm:ml-5 flex flex-col space-y-2">
                      <input
                        type="file"
                        id="photo-upload"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white dark:bg-gray-800 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                      >
                        Upload new photo
                      </button>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
                        >
                          Remove photo
                        </button>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        JPG, PNG, or GIF. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5">
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      // Resetta le modifiche
                      if (session?.user?.email) {
                        // Controlla se esiste un'immagine nel localStorage
                        const savedImage = ImageService.getImageFromLocalStorage(session.user.email);
                        if (savedImage) {
                          setProfileImage(savedImage);
                          setStoreProfileImage(savedImage);
                        } else if (session?.user?.image) {
                          setProfileImage(session.user.image);
                          setStoreProfileImage(session.user.image);
                        } else {
                          setProfileImage(null);
                          setStoreProfileImage(null);
                        }
                      } else {
                        setProfileImage(null);
                        setStoreProfileImage(null);
                      }
                      toast.success('Changes cancelled');
                    }}
                    className="w-full sm:w-auto bg-white dark:bg-gray-800 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Simula il salvataggio
                      setTimeout(() => {
                        toast.success('Changes saved successfully');
                      }, 500);
                    }}
                    className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Account</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Gestisci le impostazioni del tuo account.
                </p>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-base font-medium text-gray-900 dark:text-white">Account Deletion</h4>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Once you delete your account, you cannot go back. All your data will be permanently removed. Please be certain.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-100 dark:bg-red-900/40 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete account'}
                  </button>
                  {deleteError && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                  Language Settings
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Select your preferred interface language
                </p>
              </div>

              <div className="max-w-xl">
                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-4">
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Language
                    </label>
                    <div className="mt-1">
                      <LanguageSelector />
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      The currently selected language is: {SUPPORTED_LANGUAGES['en']}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    Available Languages
                  </h4>
                  <div className="mt-4 space-y-4">
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <div key={code} className="flex items-center">
                        <div className="flex-shrink-0">
                          {code === 'en' && (
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-600"></span>
                          )}
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {code === 'en' ? 'Current language' : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        Translation Information
                      </h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Translations are loaded automatically when you change language.
                        If you encounter any issues with translations, please contact support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenuto per le altre tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Notification Preferences</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Decide how and when you receive updates.
                </p>
              </div>
              
              {/* Notifiche email */}
              <div className="mt-6">
                <fieldset>
                  <legend className="text-base font-medium text-gray-900 dark:text-white">Email</legend>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="comments"
                          name="comments"
                          type="checkbox"
                          defaultChecked
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="comments" className="font-medium text-gray-700 dark:text-gray-300">Comments</label>
                        <p className="text-gray-500 dark:text-gray-400">Get notified when someone comments on your posts.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="mentions"
                          name="mentions"
                          type="checkbox"
                          defaultChecked
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="mentions" className="font-medium text-gray-700 dark:text-gray-300">Mentions</label>
                        <p className="text-gray-500 dark:text-gray-400">Get notified when someone mentions you.</p>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
              
              {/* Notifiche push */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <fieldset>
                  <legend className="text-base font-medium text-gray-900 dark:text-white">Push Notifications</legend>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="push-everything"
                          name="push-notifications"
                          type="radio"
                          defaultChecked
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="push-everything" className="font-medium text-gray-700 dark:text-gray-300">All notifications</label>
                        <p className="text-gray-500 dark:text-gray-400">Receive all push notifications.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="push-email"
                          name="push-notifications"
                          type="radio"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="push-email" className="font-medium text-gray-700 dark:text-gray-300">Only email</label>
                        <p className="text-gray-500 dark:text-gray-400">Only receive notifications via email.</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="push-nothing"
                          name="push-notifications"
                          type="radio"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="push-nothing" className="font-medium text-gray-700 dark:text-gray-300">No notifications</label>
                        <p className="text-gray-500 dark:text-gray-400">Do not receive push notifications.</p>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
            
          )}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">AI</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure the AI settings.
                </p>
              </div>
              
              {/* Notifiche email */}
              <div className="mt-6">
                <fieldset>
                  <legend className="text-base font-medium text-gray-900 dark:text-white">AI</legend>
                  <div className="mt-4 space-y-4">
                    <AISettingsPanel />
                    
                  </div>
                </fieldset>
              </div>
            </div>
            
          )}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Billing</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure billing settings.
                </p>
              </div>
              
              {/* Notifiche email */}
              <div className="mt-6">
                <fieldset>
                  <legend className="text-base font-medium text-gray-900 dark:text-white">Billing</legend>
                  <div className="mt-4 space-y-4">
                  <SubscriptionProvider>
                  <SubscriptionSettings />
                  </SubscriptionProvider>
                  </div>
                </fieldset>
              </div>
            </div>
            
          )}
          

          {/* Tab placeholder per le altre sezioni */}
          
        </div>
      </div>
    </EnhancedLayout>
  );
}
