// src/pages/profile/index.tsx

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { DynamicLayout } from 'src/components/dynamic-imports';
import { User, Mail, MapPin, Calendar, Edit, GitHub, Globe, Settings, Layout } from 'react-feather';
import Loading from '@/src/components/ui/Loading';
import MetaTags from '@/src/components/layout/Metatags';
import ImageService from '@/src/lib/imageService';
import useUserProfileStore from '@/src/store/userProfileStore';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  github: string | null;
  createdAt: string;
  organizations: {
    id: string;
    name: string;
    role: string;
  }[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Component {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

interface Toolpath {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { username } = router.query; // For viewing other profiles
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [toolpaths, setToolpaths] = useState<Toolpath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'projects' | 'components' | 'toolpaths'>('projects');
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const { profileImage: storeProfileImage, setProfileImage: setStoreProfileImage } = useUserProfileStore();
  
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
  useEffect(() => {
    if (status === 'authenticated') {
      // Determine if viewing own profile or someone else's
      if (!username || username === session?.user?.id) {
        setIsOwnProfile(true);
        fetchOwnProfile();
      } else {
        setIsOwnProfile(false);
        fetchUserProfile(username as string);
      }
    } else if (status === 'unauthenticated' && !username) {
      router.push('/auth/signup');
    }
  }, [status, username, session]);

  const fetchOwnProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch profile data
      const profileRes = await fetch('/api/user/profile');
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setProfile(profileData);
      
      // Fetch projects
      const projectsRes = await fetch('/api/user/projects');
      if (!projectsRes.ok) throw new Error('Failed to fetch projects');
      const projectsData = await projectsRes.json();
      setProjects(projectsData);
      
      // Fetch components
      const componentsRes = await fetch('/api/user/components');
      if (!componentsRes.ok) throw new Error('Failed to fetch components');
      const componentsData = await componentsRes.json();
      setComponents(componentsData);

      // Fetch toolpaths
      const toolpathsRes = await fetch('/api/user/toolpaths');
      if (!toolpathsRes.ok) throw new Error('Failed to fetch toolpaths');
      const toolpathsData = await toolpathsRes.json();
      setToolpaths(toolpathsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      // Fetch public profile data
      const profileRes = await fetch(`/api/users/${userId}`);
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();
      setProfile(profileData);
      
      // Fetch public projects
      const projectsRes = await fetch(`/api/users/${userId}/projects`);
      if (!projectsRes.ok) throw new Error('Failed to fetch projects');
      const projectsData = await projectsRes.json();
      setProjects(projectsData);
      
      // Fetch public components
      const componentsRes = await fetch(`/api/users/${userId}/components`);
      if (!componentsRes.ok) throw new Error('Failed to fetch components');
      const componentsData = await componentsRes.json();
      setComponents(componentsData);

      // Fetch public toolpaths
      const toolpathsRes = await fetch(`/api/users/${userId}/toolpaths`);
      if (!toolpathsRes.ok) throw new Error('Failed to fetch toolpaths');
      const toolpathsData = await toolpathsRes.json();
      setToolpaths(toolpathsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (status === 'loading' || isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loading/></div>;
  }

  if (!profile) {
    return (
      <Layout>
        <div className="p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User not found</h1>
          <p className="text-gray-600 mb-4">The profile you are looking for doesnt exist or isnt available.</p>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            Return to homepage
          </Link>
        </div>
      </Layout>
    );
  }
  
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  return (
    <>
      <MetaTags
  ogImage="/og-image.png" 
        title={`${profile.name || 'User'} | Profile`}
        description={`View ${profile.name || 'User'}'s profile, projects and components.`}
      />
      <DynamicLayout>
        {/* Profile Header - Add rounded-xl */}
        <div className="bg-[#F8FBFF] dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-xl mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex items-center space-x-5">
                <div className="flex-shrink-0">
                {profileImage ? (
                          <img
                            src={profileImage} 
                            alt="Profile" 
                            className="h-24 w-24 rounded-full object-cover"
                          />
                        ) : (
                          <svg className="h-20 w-20 rounded-full text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        )}
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-blue-400 sm:truncate">
                    {profile.name || 'User'}
                  </h1>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                    {profile.email && (
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {profile.email}
                      </div>
                    )}
                    {profile.location && (
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        {profile.location}
                      </div>
                    )}
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                      Joined {formatDate(profile.createdAt)}
                    </div>
                    {profile.website && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Link href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400">
                          <Globe className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          Website
                        </Link>
                      </div>
                    )}
                    {profile.github && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Link href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                          <GitHub className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          GitHub
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {isOwnProfile && (
                <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                  <Link href="/profile/settings" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <Settings className="-ml-1 mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </div>
              )}
            </div>
            {profile.bio && (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">About</h2>
                <p className="mt-1 text-sm text-gray-900 dark:text-blue-400">{profile.bio}</p>
              </div>
            )}
          </div>
          {/* Stats Section - Add rounded-xl */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700 rounded-b-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Projects</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-blue-400">{projects.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Components</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-blue-400">{components.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Toolpaths</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-blue-400">{toolpaths.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Organizations</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-blue-400">{profile.organizations?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {['projects', 'components', 'toolpaths'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm 
                    ${activeTab === tab
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content - Apply Card Styles */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeTab === 'projects' && projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} 
                  // Apply card styling
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border dark:border-gray-700 overflow-hidden">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No thumbnail</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-blue-400 truncate">{project.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Updated {new Date(project.updatedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}

          {activeTab === 'components' && components.map((component) => (
            <Link href={`/components/${component.id}`} key={component.id} 
                  // Apply card styling
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border dark:border-gray-700 overflow-hidden">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {component.thumbnail ? (
                  <img src={component.thumbnail} alt={component.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No thumbnail</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-blue-400 truncate">{component.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{component.description || 'No description'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Updated {new Date(component.updatedAt).toLocaleDateString()}</p>
                {component.projectId && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block">View Project</span>
                )}
              </div>
            </Link>
          ))}
          
          {activeTab === 'toolpaths' && toolpaths.map((toolpath) => (
            <Link href={`/toolpaths/${toolpath.id}`} key={toolpath.id} 
                  // Apply card styling
                  className="block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border dark:border-gray-700 overflow-hidden">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {toolpath.thumbnail ? (
                  <img src={toolpath.thumbnail} alt={toolpath.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No thumbnail</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-blue-400 truncate">{toolpath.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Updated {new Date(toolpath.updatedAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}

          {/* Empty States */}
          {activeTab === 'projects' && projects.length === 0 && <EmptyState message="No projects found." />}
          {activeTab === 'components' && components.length === 0 && <EmptyState message="No components found." />}
          {activeTab === 'toolpaths' && toolpaths.length === 0 && <EmptyState message="No toolpaths found." />}
        </div>
      </DynamicLayout>
    </>
  );
}

// Helper component for empty states
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12">
    <Layout size={48} className="mx-auto text-gray-400 dark:text-gray-500" />
    <p className="mt-2 text-sm font-medium text-gray-900 dark:text-blue-400">{message}</p>
  </div>
);