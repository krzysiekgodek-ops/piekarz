import React, { useState, useEffect, useMemo, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDoc, getCountFromServer, onSnapshot, query, where, addDoc, serverTimestamp, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { auth, db, SUPER_ROOT } from './firebase';
import useTheme from './hooks/useTheme';

import Header      from './components/Header';
import BottomNav   from './components/BottomNav';
import AuthModal   from './components/AuthModal';
import RecipeModal from './components/RecipeModal';
import RecipeList  from './components/RecipeList';
import Calculator  from './components/Calculator';
import ClientPanel from './components/ClientPanel';
import AdminPanel  from './components/AdminPanel';
import HomeScreen  from './components/HomeScreen';

const DEFAULT_PLANS = {
  food: {
    free:  { name: 'Free',  limit: 2,   price: '0 zł' },
    mini:  { name: 'Mini',  limit: 10,  price: '12 zł / rok' },
    midi:  { name: 'Midi',  limit: 20,  price: '20 zł / rok' },
    maxi:  { name: 'Maxi',  limit: 30,  price: '30 zł / rok' },
    max:   { name: 'Max',   limit: 30,  price: '30 zł / rok' },
    vip:   { name: 'VIP',   limit: 100, price: '60 zł / rok' },
  },
};

const SAMPLE_RECIPES = [
  {
    id: '__sample_chleb_pszenny',
    ownerId: 'ADMIN',
    name: 'Chleb pszenny na drożdżach',
    category: 'Chleby pszenne',
    flours: [
      { name: 'Mąka pszenna T550', percent: 100 },
    ],
    ingredients: [
      { name: 'Woda', percent: 68, unit: 'g' },
      { name: 'Drożdże świeże', percent: 2, unit: 'g' },
      { name: 'Sól', percent: 2, unit: 'g' },
    ],
    waterTemp: 22,
    stages: [
      { name: 'Wyrabianie', duration: 12, durationUnit: 'min', temp: null, description: 'Wyrabiaj ciasto do gładkości.' },
      { name: 'Fermentacja wstępna', duration: 60, durationUnit: 'min', temp: 24, description: 'Odpoczynek w temperaturze pokojowej.' },
      { name: 'Formowanie', duration: null, durationUnit: 'min', temp: null, description: 'Uformuj bochenek i przełóż do koszyka.' },
      { name: 'Garowanie', duration: 40, durationUnit: 'min', temp: 28, description: 'Garownia lub ciepłe miejsce.' },
      { name: 'Pieczenie', duration: 35, durationUnit: 'min', temp: 230, description: 'Piecz z parą przez pierwsze 15 minut, następnie bez pary.' },
    ],
    description: 'Klasyczny chleb pszenny — chrupiąca skórka, miękki miąższ. Przykładowa receptura wzorcowa.',
    imageUrl: '',
    videoUrl: '',
  },
];

const App = () => {
  const { theme, toggleTheme } = useTheme();

  const [user, setUser]               = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [allUsers, setAllUsers]       = useState([]);
  const [recipes, setRecipes]         = useState({});
  const [categories, setCategories]   = useState([]);
  const [ads, setAds]                 = useState([]);
  const [plans, setPlans]             = useState(null);

  const hashTabRef = useRef(null);

  const [activeTab, setActiveTab]     = useState('home');
  const [prevTab, setPrevTab]         = useState('recipes');
  const [selectedKey, setSelectedKey] = useState('');
  const [totalTarget, setTotalTarget] = useState(1);

  const [isAuthModalOpen, setIsAuthModalOpen]     = useState(false);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit]           = useState(null);

  // Odczyt hash przy starcie — zapisuje do ref, żeby nie zostać nadpisany przez onAuthStateChanged
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#receptury') hashTabRef.current = 'recipes';
    else if (hash === '#moje') hashTabRef.current = 'my-recipes';
    else if (hash === '#konto') hashTabRef.current = 'account';
    if (hash) window.history.replaceState(null, '', window.location.pathname);
  }, []);

  // Firebase: auth + pricing
  useEffect(() => {
    const unsubPricing = onSnapshot(doc(db, 'settings', 'pricing'), s => {
      if (s.exists()) setPlans(s.data());
      else setDoc(doc(db, 'settings', 'pricing'), DEFAULT_PLANS);
    });

    const unsubAuth = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        setIsAuthModalOpen(false);
        const userRef = doc(db, 'users', u.uid);
        const userSnap = await getDoc(userRef);
        let profileData;
        if (userSnap.exists()) {
          profileData = userSnap.data();
          if (profileData.recipeCount == null) {
            const countSnap = await getCountFromServer(
              query(collection(db, 'piekarz_recipes'), where('ownerId', '==', u.uid))
            );
            const count = countSnap.data().count;
            const countUpdate = { recipeCount: count };
            if (profileData.plan === 'vip') countUpdate.vipRecipesCount = count;
            await updateDoc(userRef, countUpdate);
            profileData = { ...profileData, recipeCount: count };
            if (profileData.plan === 'vip') profileData.vipRecipesCount = count;
          }
        } else {
          profileData = {
            email: u.email || 'Użytkownik',
            plan: 'free',
            tools: ['piekarski'],
            favorites: [],
            createdAt: new Date().toISOString(),
            isAdmin: u.email === SUPER_ROOT,
            recipeCount: 0,
          };
          await setDoc(userRef, profileData);
        }
        if (u.email === SUPER_ROOT) profileData.isAdmin = true;
        profileData.isTrialActive = Math.floor((new Date() - new Date(profileData.createdAt)) / 86400000) <= 21;
        if (!profileData.favorites) profileData.favorites = [];
        setUserProfile(profileData);
        if (hashTabRef.current) {
          setActiveTab(hashTabRef.current);
          hashTabRef.current = null;
        }
      } else {
        setUserProfile(null);
        if (hashTabRef.current) {
          setActiveTab(hashTabRef.current);
          hashTabRef.current = null;
        } else {
          setActiveTab('home');
        }
      }
    });

    return () => { unsubPricing(); unsubAuth(); };
  }, []);

  // Firebase: użytkownicy + reklamy (tylko admin)
  useEffect(() => {
    if (!userProfile?.isAdmin) return;
    const unsubUsers = onSnapshot(collection(db, 'users'), snap => {
      setAllUsers(snap.docs.map(d => ({ ...d.data(), id: d.id, tools: d.data().tools || ['piekarski'] })));
    });
    const unsubAds = onSnapshot(collection(db, 'ads'), snap => {
      setAds(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => { unsubUsers(); unsubAds(); };
  }, [userProfile?.isAdmin]);

  // Firebase: receptury + kategorie
  useEffect(() => {
    const ownerIds = user ? ['ADMIN', user.uid] : ['ADMIN'];
    const q = query(collection(db, 'piekarz_recipes'), where('ownerId', 'in', ownerIds));
    const unsubRecipes = onSnapshot(q, snapshot => {
      const docs = {};
      snapshot.forEach(d => docs[d.id] = { ...d.data(), id: d.id });
      setRecipes(docs);
    });
    const unsubCats = onSnapshot(collection(db, 'piekarz_categories'), snap => {
      setCategories(snap.docs.map(d => d.data().name).sort());
    });
    return () => { unsubRecipes(); unsubCats(); };
  }, [user]);

  const handleSelectRecipe = (recipe, sourceTab) => {
    setSelectedKey(recipe.id);
    setPrevTab(sourceTab || activeTab);
    setActiveTab('calculator');
  };

  const toggleFavorite = async (recipeId) => {
    if (!user) { setIsAuthModalOpen(true); return; }
    const current = userProfile?.favorites || [];
    const updated = current.includes(recipeId)
      ? current.filter(id => id !== recipeId)
      : [...current, recipeId];
    await updateDoc(doc(db, 'users', user.uid), { favorites: updated });
    setUserProfile(prev => ({ ...prev, favorites: updated }));
  };

  const openRecipeModal = (recipe = null) => {
    setRecipeToEdit(recipe);
    setIsRecipeModalOpen(true);
  };

  const handleSaveRecipe = async (formRecipe) => {
    if (!formRecipe.name || !formRecipe.category) return alert("Uzupełnij dane!");
    const totalFlourPercent = (formRecipe.flours || []).reduce((acc, f) => acc + Number(f.percent ?? 0), 0);
    if (Math.abs(totalFlourPercent - 100) > 0.5) return alert("Suma procentów mąki musi wynosić 100%!");
    try {
      const payload = {
        name:        formRecipe.name,
        category:    formRecipe.category,
        flours:      (formRecipe.flours || []).map(f => ({ name: f.name, percent: Number(f.percent ?? 0), kg: Number(f.kg ?? 0) })),
        ingredients: (formRecipe.ingredients || []).map(ing => ({ name: ing.name, percent: Number(ing.percent ?? 0), unit: ing.unit || 'g' })),
        waterTemp:   formRecipe.waterTemp != null ? Number(formRecipe.waterTemp) : null,
        stages:      (formRecipe.stages || []).map(s => ({
          name:         s.name,
          duration:     s.duration != null ? Number(s.duration) : null,
          durationUnit: s.durationUnit || 'min',
          temp:         s.temp != null ? Number(s.temp) : null,
          description:  s.description || '',
        })),
        description: formRecipe.description || '',
        imageUrl:    formRecipe.imageUrl || '',
        videoUrl:    formRecipe.videoUrl || '',
        updatedAt:   serverTimestamp(),
        ownerId:     userProfile?.isAdmin ? 'ADMIN' : user.uid,
      };
      const isRealFirestoreId = formRecipe.id && !String(formRecipe.id).startsWith('__sample_');
      if (isRealFirestoreId) {
        await updateDoc(doc(db, 'piekarz_recipes', formRecipe.id), payload);
      } else {
        await addDoc(collection(db, 'piekarz_recipes'), payload);
        if (!userProfile?.isAdmin) {
          const countUpdate = { recipeCount: increment(1) };
          if (userProfile?.plan === 'vip') countUpdate.vipRecipesCount = increment(1);
          await updateDoc(doc(db, 'users', user.uid), countUpdate);
        }
      }
      setIsRecipeModalOpen(false);
    } catch (e) { alert(e.message); }
  };

  const updatePlayerPlan = async (userId, newPlan) =>
    await updateDoc(doc(db, 'users', userId), { plan: newPlan });

  const toggleAdmin = async (userId, currentStatus) => {
    if (userProfile.email !== SUPER_ROOT) return alert("Tylko Właściciel.");
    await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
  };

  const deleteUserAccount = async (userId, userEmail) => {
    if (userProfile.email !== SUPER_ROOT) return alert("Tylko Właściciel może usuwać konta.");
    if (userEmail === SUPER_ROOT) return alert("Nie możesz usunąć konta głównego Właściciela!");
    if (window.confirm(`Czy na pewno chcesz bezpowrotnie usunąć z bazy użytkownika ${userEmail || 'Brak Emaila'}?`)) {
      try { await deleteDoc(doc(db, 'users', userId)); } catch (e) { alert("Błąd usuwania: " + e.message); }
    }
  };

  const updatePrice = async (branch, planKey, newData) => {
    const newPlans = {
      ...plans,
      [branch]: { ...(plans?.[branch] || {}), [planKey]: newData }
    };
    await setDoc(doc(db, 'settings', 'pricing'), newPlans);
  };

  const userRecipesList  = useMemo(() => Object.values(recipes), [recipes]);
  const currentRecipe    = recipes[selectedKey] ?? SAMPLE_RECIPES.find(r => r.id === selectedKey) ?? null;
  const adminRecipes     = useMemo(() => {
    const fromFirestore = Object.values(recipes).filter(r => r.ownerId === 'ADMIN' && !r.blocked);
    return fromFirestore.length > 0 ? fromFirestore : SAMPLE_RECIPES;
  }, [recipes]);
  const myRecipes        = useMemo(() => Object.values(recipes).filter(r => r.ownerId === user?.uid && !r.blocked), [recipes, user]);
  const favoriteIds      = userProfile?.favorites || [];
  const favoriteRecipes  = useMemo(() => adminRecipes.filter(r => favoriteIds.includes(r.id)), [adminRecipes, favoriteIds]);

  const recipeLimit = useMemo(() => {
    if (userProfile?.isTrialActive) return 100;
    const plan = userProfile?.plan || 'free';
    return ((plans?.food ?? DEFAULT_PLANS.food)[plan] ?? DEFAULT_PLANS.food.free).limit;
  }, [userProfile, plans]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      <style>{`
        @media print {
          .no-print, header, footer, nav, .trial-banner { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .print-container { display: block !important; width: 100% !important; }
          @page { size: auto; margin: 15mm; }
        }
      `}</style>

      <Header
        user={user}
        userProfile={userProfile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setIsAuthModalOpen={setIsAuthModalOpen}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main
        className="max-w-2xl mx-auto"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
      >
        {activeTab === 'home' && (
          <HomeScreen setActiveTab={setActiveTab} ads={ads} />
        )}

        {activeTab === 'recipes' && (
          <RecipeList
            recipes={adminRecipes}
            categories={categories}
            ads={ads}
            user={user}
            userProfile={userProfile}
            favoriteIds={favoriteIds}
            onSelectRecipe={(r) => handleSelectRecipe(r, 'recipes')}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {activeTab === 'my' && userProfile && (
          <ClientPanel
            user={user}
            userProfile={userProfile}
            myRecipes={myRecipes}
            favoriteRecipes={favoriteRecipes}
            favoriteIds={favoriteIds}
            plans={plans}
            onSelectRecipe={(r) => handleSelectRecipe(r, 'my')}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'account' && userProfile && (
          <ClientPanel
            user={user}
            userProfile={userProfile}
            myRecipes={myRecipes}
            favoriteRecipes={favoriteRecipes}
            favoriteIds={favoriteIds}
            plans={plans}
            accountView
            onSelectRecipe={(r) => handleSelectRecipe(r, 'account')}
            onOpenRecipeModal={openRecipeModal}
            onToggleFavorite={toggleFavorite}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'calculator' && (
          <Calculator
            user={user}
            userProfile={userProfile}
            recipe={currentRecipe}
            totalTarget={totalTarget}
            setTotalTarget={setTotalTarget}
            onBack={() => setActiveTab(prevTab)}
            onEditRecipe={openRecipeModal}
          />
        )}

        {activeTab === 'superadmin' && userProfile?.isAdmin && (
          <AdminPanel
            allUsers={allUsers}
            categories={categories}
            ads={ads}
            allRecipes={userRecipesList}
            updatePlayerPlan={updatePlayerPlan}
            toggleAdmin={toggleAdmin}
            deleteUserAccount={deleteUserAccount}
            onAddRecipe={() => openRecipeModal(null)}
          />
        )}
      </main>

      {activeTab !== 'superadmin' && activeTab !== 'calculator' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          setIsAuthModalOpen={setIsAuthModalOpen}
        />
      )}

      {isAuthModalOpen && (
        <AuthModal onClose={() => setIsAuthModalOpen(false)} />
      )}

      {isRecipeModalOpen && (
        <RecipeModal
          user={user}
          categories={categories}
          initialRecipe={recipeToEdit}
          onClose={() => setIsRecipeModalOpen(false)}
          onSave={handleSaveRecipe}
          recipeCount={myRecipes.length}
          recipeLimit={recipeLimit}
        />
      )}
    </div>
  );
};

export default App;
